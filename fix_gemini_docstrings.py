#!/usr/bin/env python3
"""Fix docstring escaping in gemini_service.py"""

import os

fpath = os.path.join("backend", "app", "services", "detection", "gemini_service.py")
with open(fpath, "r", encoding="utf-8") as f:
    content = f.read()

# The broken pattern is: \\\"\\\"\\\" (backslash-quote triple)
# We want to replace with: """ (proper triple quote)
# In Python string literals, to match \\\" we need \\\\\\\"

# Count before
count_before = content.count('\\\\\\"\\\\\\"\\\\\\"')
print(f"Occurrences before: {count_before}")

# Replace all occurrences of the broken pattern with proper quotes
# The broken pattern in the file is literal backslash-quote repeated 3 times
# We want to replace with just triple double-quote
content = content.replace('\\\\\\"\\\\\\"\\\\\\"', '"""')

# Count after
count_after = content.count('\\\\\\"\\\\\\"\\\\\\"')
print(f"Occurrences after: {count_after}")

# Write back
with open(fpath, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed gemini_service.py docstrings")