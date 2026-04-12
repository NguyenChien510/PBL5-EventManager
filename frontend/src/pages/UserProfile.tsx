import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon, Avatar } from "../components/ui";
import { TicketCard, TransactionItem } from "../components/domain";
import { DashboardLayout } from "../components/layout";
import { userSidebarConfig } from "../config/userSidebarConfig";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  fetchProfileOverview,
  updateProfile,
  topUpWallet,
  linkWalletCard,
} from "@/services/profileService";
import type { UserProfileOverview } from "@/types";

const TICKET_PLACEHOLDER =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop";

const DEFAULT_AVATAR =
  "https://api.dicebear.com/7.x/avataaars/svg?seed=EventUser";

const MEMBERSHIP_LABELS: Record<string, string> = {
  STANDARD: "Thành viên Tiêu chuẩn",
  SILVER: "Thành viên Bạc",
  GOLD: "Thành viên Vàng",
  PLATINUM: "Thành viên Bạch kim",
  DIAMOND: "Thành viên Kim cương",
};

function membershipLabel(tier?: string | null): string {
  if (!tier) return MEMBERSHIP_LABELS.STANDARD;
  const key = tier.toUpperCase();
  return MEMBERSHIP_LABELS[key] ?? MEMBERSHIP_LABELS.STANDARD;
}

function formatVnd(value: number | undefined): string {
  const n = value ?? 0;
  return new Intl.NumberFormat("vi-VN").format(n);
}

function formatTicketDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function mapTierToCardType(
  label: string,
): "Premium" | "Standard" | "VIP" {
  const u = label.toUpperCase();
  if (u.includes("VIP")) return "VIP";
  if (u.includes("PREMIUM") || u.includes("PREMI")) return "Premium";
  return "Standard";
}

type TxRow = {
  icon: string;
  title: string;
  date: string;
  amount: string;
  positive: boolean;
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, setUser } = useAuthStore();
  const [overview, setOverview] = useState<UserProfileOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txRows, setTxRows] = useState<TxRow[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpSaving, setTopUpSaving] = useState(false);

  const [cardOpen, setCardOpen] = useState(false);
  const [cardLastFour, setCardLastFour] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfileOverview();
      setOverview(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không tải được dữ liệu hồ sơ.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const displayAvatar: string =
    overview?.profile.avatarUrl ||
    overview?.profile.avatar ||
    authUser?.avatarUrl ||
    authUser?.avatar ||
    DEFAULT_AVATAR;

  const sidebarProps = useMemo(() => {
    const ticketBadge = overview?.stats.activeTicketsCount;
    return {
      ...userSidebarConfig,
      sections: userSidebarConfig.sections.map((section) => ({
        ...section,
        links: section.links.map((link) =>
          link.to === "/tickets" && ticketBadge != null && ticketBadge > 0
            ? { ...link, badge: ticketBadge }
            : link,
        ),
      })),
      user: {
        name: overview?.profile.fullName ?? authUser?.fullName ?? "Bạn",
        role: membershipLabel(
          overview?.profile.membershipTier ?? authUser?.membershipTier,
        ),
        avatar: displayAvatar,
      },
    };
  }, [overview, authUser, displayAvatar]);

  const openEdit = () => {
    if (!overview) return;
    setEditFullName(overview.profile.fullName ?? "");
    setEditAvatarUrl(overview.profile.avatarUrl ?? "");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    setEditSaving(true);
    try {
      const updated = await updateProfile({
        fullName: editFullName.trim() || undefined,
        avatarUrl: editAvatarUrl.trim(),
      });
      setUser(
        authUser ? { ...authUser, ...updated } : { ...updated, id: updated.id },
      );
      setOverview((prev) =>
        prev ? { ...prev, profile: { ...prev.profile, ...updated } } : prev,
      );
      setEditOpen(false);
    } catch {
      setError("Không lưu được hồ sơ. Thử lại sau.");
    } finally {
      setEditSaving(false);
    }
  };

  const submitTopUp = async () => {
    const raw = topUpAmount.replace(/\./g, "").replace(/,/g, "").trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 1000) {
      setError("Số tiền nạp tối thiểu 1.000 VNĐ.");
      return;
    }
    setTopUpSaving(true);
    setError(null);
    try {
      const wallet = await topUpWallet(amount);
      setOverview((prev) => (prev ? { ...prev, wallet } : prev));
      const now = new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTxRows((rows) => [
        {
          icon: "add_card",
          title: "Nạp tiền vào ví",
          date: now,
          amount: `${formatVnd(amount)} VNĐ`,
          positive: true,
        },
        ...rows,
      ]);
      setTopUpAmount("");
      setTopUpOpen(false);
    } catch {
      setError("Nạp tiền thất bại. Kiểm tra số tiền và thử lại.");
    } finally {
      setTopUpSaving(false);
    }
  };

  const submitCard = async () => {
    if (!/^\d{4}$/.test(cardLastFour.trim())) {
      setError("Nhập đúng 4 số cuối thẻ.");
      return;
    }
    setCardSaving(true);
    setError(null);
    try {
      const wallet = await linkWalletCard(cardLastFour.trim());
      setOverview((prev) => (prev ? { ...prev, wallet } : prev));
      setCardOpen(false);
      setCardLastFour("");
    } catch {
      setError("Không cập nhật được thẻ.");
    } finally {
      setCardSaving(false);
    }
  };

  const recentTickets = overview?.recentTickets ?? [];

  return (
    <DashboardLayout sidebarProps={sidebarProps}>
      <header className="h-20 px-8 lg:px-12 flex items-center justify-between sticky top-0 z-40 bg-background-light/90 backdrop-blur-sm border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Hồ sơ người dùng</h2>
        <div className="flex items-center gap-5">
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
            aria-label="Tìm kiếm"
          >
            <Icon name="search" />
          </button>
          <button
            type="button"
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary relative"
            aria-label="Thông báo"
          >
            <Icon name="notifications" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <Link
            to="/settings"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <Avatar
              src={displayAvatar}
              size="md"
              className="rounded-lg ring-2 ring-white shadow-sm"
            />
            <span className="text-sm font-semibold text-slate-700 group-hover:text-primary transition-colors max-w-[140px] truncate">
              {overview?.profile.fullName ?? authUser?.fullName ?? "Tài khoản"}
            </span>
          </Link>
        </div>
      </header>

      <div className="px-8 lg:px-12 pb-12 space-y-12">
        {error && (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-4"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              className="shrink-0 text-rose-700 font-bold hover:underline"
              onClick={() => {
                setError(null);
                void loadOverview();
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        {loading && (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 h-48 bg-slate-200 rounded-2xl" />
              <div className="h-48 bg-slate-300 rounded-2xl" />
            </div>
            <div className="h-32 bg-slate-200 rounded-2xl" />
          </div>
        )}

        {!loading && overview && (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 section-card p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar
                      src={displayAvatar}
                      size="xl"
                      className="rounded-2xl shadow-md border-4 border-white"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-lg shadow-md">
                      <Icon name="verified" className="text-primary" filled />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-slate-900 truncate">
                        {overview.profile.fullName}
                      </h3>
                      <span className="px-2 py-0.5 bg-blue-50 text-primary text-[10px] font-bold rounded-md border border-blue-100 uppercase whitespace-nowrap">
                        {membershipLabel(overview.profile.membershipTier)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 break-all">
                      {overview.profile.email}
                      {overview.profile.joinYear != null &&
                        ` • Tham gia từ ${overview.profile.joinYear}`}
                    </p>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Sự kiện
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {overview.stats.eventsAttendedCount}
                        </p>
                      </div>
                      <div className="w-px bg-slate-100" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Điểm tích lũy
                        </p>
                        <p className="text-lg font-bold text-slate-800">
                          {formatVnd(overview.profile.loyaltyPoints ?? 0)}{" "}
                          <span className="text-xs text-slate-400">pts</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary flex items-center justify-center gap-2 text-sm shrink-0"
                  onClick={openEdit}
                >
                  <Icon name="edit" size="sm" />
                  Sửa hồ sơ
                </button>
              </div>

              <div className="section-card p-6 flex flex-col justify-between bg-primary relative overflow-hidden min-h-[200px]">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Icon
                    name="account_balance_wallet"
                    className="text-white text-7xl"
                  />
                </div>
                <div className="relative z-10">
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                    Số dư Ví Ocean
                  </p>
                  <h4 className="text-3xl font-extrabold text-white">
                    {formatVnd(overview.wallet.balance)}{" "}
                    <span className="text-sm font-medium opacity-80">VNĐ</span>
                  </h4>
                </div>
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mt-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon name="credit_card" className="text-white/80 shrink-0" />
                    <span className="text-xs text-white/90 font-medium truncate">
                      {overview.wallet.cardLastFour
                        ? `**** ${overview.wallet.cardLastFour}`
                        : "Chưa liên kết thẻ"}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] font-bold text-white/90 underline hover:text-white"
                      onClick={() => {
                        setCardLastFour(overview.wallet.cardLastFour ?? "");
                        setCardOpen(true);
                      }}
                    >
                      Cập nhật
                    </button>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                    onClick={() => setTopUpOpen(true)}
                  >
                    Nạp tiền
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-800">Vé của tôi</h3>
                  <span className="px-2.5 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                    {overview.stats.activeTicketsCount}
                  </span>
                </div>
                <Link
                  to="/tickets"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Xem tất cả
                </Link>
              </div>
              {recentTickets.length === 0 ? (
                <div className="section-card p-8 text-center text-slate-500 text-sm">
                  Bạn chưa có vé nào.{" "}
                  <Link to="/explore" className="text-primary font-bold">
                    Khám phá sự kiện
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {recentTickets.map((t) => (
                    <TicketCard
                      key={t.id}
                      image={TICKET_PLACEHOLDER}
                      title={t.eventTitle || "Sự kiện"}
                      ticketId={t.code}
                      date={formatTicketDate(t.purchaseDate)}
                      seat={`Hạng: ${t.ticketTierLabel || "—"}`}
                      location="—"
                      type={mapTierToCardType(t.ticketTierLabel || "")}
                      status="active"
                      onViewDetail={() => navigate("/tickets")}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">
                    Lịch sử giao dịch
                  </h3>
                </div>
                <div className="section-card divide-y divide-slate-100">
                  {txRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                      Chưa có giao dịch gần đây. Nạp tiền để thấy lịch sử tại
                      đây.
                    </div>
                  ) : (
                    txRows.map((tx, i) => (
                      <TransactionItem key={i} {...tx} />
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-4">
                <h3 className="text-lg font-bold text-slate-800 mb-6">
                  Ưu đãi cá nhân
                </h3>
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center mb-4">
                      <Icon name="auto_awesome" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      Gói VIP Experience
                    </h4>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                      Nhận mã giảm cho sự kiện tiếp theo — khám phá theo sở
                      thích của bạn.
                    </p>
                    <Link
                      to="/explore"
                      className="block w-full py-3 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-blue-600 transition-colors tracking-widest text-center"
                    >
                      KHÁM PHÁ NGAY
                    </Link>
                  </div>
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          onClick={() => !editSaving && setEditOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-profile-title" className="text-lg font-bold text-slate-900">
              Sửa hồ sơ
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Họ và tên
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Ảnh đại diện (URL)
              </label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-slate-600"
                disabled={editSaving}
                onClick={() => setEditOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm"
                disabled={editSaving}
                onClick={() => void submitEdit()}
              >
                {editSaving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {topUpOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="topup-title"
          onClick={() => !topUpSaving && setTopUpOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="topup-title" className="text-lg font-bold text-slate-900">
              Nạp tiền vào ví
            </h3>
            <p className="text-xs text-slate-500">
              Tối thiểu 1.000 VNĐ. Nhập số (ví dụ 500000).
            </p>
            <input
              type="number"
              min={1000}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="500000"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-slate-600"
                disabled={topUpSaving}
                onClick={() => setTopUpOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm"
                disabled={topUpSaving}
                onClick={() => void submitTopUp()}
              >
                {topUpSaving ? "Đang xử lý…" : "Nạp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cardOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="card-title"
          onClick={() => !cardSaving && setCardOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="card-title" className="text-lg font-bold text-slate-900">
              Liên kết 4 số cuối thẻ
            </h3>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm tracking-widest"
              maxLength={4}
              inputMode="numeric"
              value={cardLastFour}
              onChange={(e) =>
                setCardLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="8829"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-slate-600"
                disabled={cardSaving}
                onClick={() => setCardOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm"
                disabled={cardSaving}
                onClick={() => void submitCard()}
              >
                {cardSaving ? "Đang lưu…" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserProfile;
