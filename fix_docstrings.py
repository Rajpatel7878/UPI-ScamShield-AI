#!/usr/bin/env python3
"""Fix docstring escaping in Python files in the detection module."""

import os
import re

BASE = os.path.join("backend", "app", "services", "detection")
FILES = [
    "gemini_service.py",
    "rules.py",
    "rule_detector.py",
    "risk_scorer.py",
    "explanation_service.py",
    "text_normalizer.py",
]

for fname in FILES:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"SKIP: {fname} not found")
        continue
    
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    lines = content.split("\n", 1)
    first_line = lines[0]
    
    # The file starts with \\\"\\\"\\\" (3 backslash-quote sequences)
    # We need to replace the first 6 characters with """
    # In the raw file text, the first 6 chars are: \\\"/\\\"/\\\"\  (backslash-quote repeated)
    # But when Python reads the string, we need to check the actual chars
    
    # Check if first line starts with backslash-quote pattern
    # In the file, the actual characters at start are: \", \", \" (backslash-quote each)
    # Python reads first_line[0] as '\\' and first_line[1] as '\"'
    
    # Simple check: does the first character have a backslash before the quote?
    if len(first_line) > 0 and first_line[0] == '\\' and len(first_line) > 1 and first_line[1] == '"':
        # We have the broken pattern - replace first 6 chars with """
        # The first 6 chars are \\\"/\\\"/\\\" (3 pairs)
        # But wait - first_line[0:6] might not be exactly 6 chars of this pattern
        # Let me just replace the entire first line's docstring start
        
        # Find where the actual content starts (after the docstring markers)
        # The pattern is \\\"\\\"\\\" followed by the content text
        # We want to change \\\"\\\"\\\" to """
        
        # Method: replace the first occurrence of \\\\\\\" at the start with \"
        # Actually, let me just do a string replacement of the known pattern
        
        # The raw file has: \\\"\\\"\\\"Google...
        # We want: """Google...
        
        # In Python string terms within this script:
        # The file literally contains backslash-quote three times at start
        # We need to replace those first few characters
        
        # Let me just slice: first 6 characters should be the 3 backslash-quote pairs
        # But actually each \\" is 2 chars, so 3 of them is 6 chars
        if len(first_line) >= 6:
            # Replace first 6 chars with """
            new_first = '"""' + first_line[6:]
            lines[0] = new_first
            content = new_first + ("\n" + lines[1] if len(lines) > 1 else "")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"FIXED: {fname}")
        else:
            print(f"  Too short: {fname}, first_line={repr(first_line)}")
    else:
        print(f"  Unexpected format: {fname}, first 20={repr(first_line[:20])}")