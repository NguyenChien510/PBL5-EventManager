import sys

with open("d:/EventManager/frontend/src/pages/OrganizerEventManage.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("d:/EventManager/frontend/src/pages/OrganizerEventManage.tsx.backup", "r", encoding="utf-8") as f:
    backup_lines = f.readlines()

new_lines = lines[:1395] + backup_lines[600:677] + lines[1575:]

with open("d:/EventManager/frontend/src/pages/OrganizerEventManage.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Replacement done")
