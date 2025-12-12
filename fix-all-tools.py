import os
import re

# List of files to fix
files_to_fix = [
    r"c:\Users\Abhishek\PycharmProjects\lab\js\tools\document-scanner.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-signature.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-security.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-page-ops.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-page-numbers.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-form-filling.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\pdf\pdf-annotations.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\image\image-crop.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\image\image-compress.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\image\background-remove.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\converters\pdf-to-image.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\converters\markdown-to-pdf.js",
    r"c:\Users\Abhishek\PycharmProjects\lab\js\converters\html-to-pdf.js",
]

# Pattern to find and replace
old_pattern = r"(\s+)const toolCard = container\.querySelector\('\.tool-card'\);\s+if \(!toolCard\) return;"

new_code = r"""\1// Create or get tool card
\1let toolCard = container.querySelector('.tool-card');
\1if (!toolCard) {
\1    toolCard = document.createElement('div');
\1    toolCard.className = 'tool-card';
\1    container.appendChild(toolCard);
\1}"""

fixed_count = 0

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply the fix
        new_content = re.sub(old_pattern, new_code, content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Fixed: {os.path.basename(filepath)}")
            fixed_count += 1
        else:
            print(f"⚠️  No change needed: {os.path.basename(filepath)}")
    else:
        print(f"❌ Not found: {filepath}")

print(f"\n🎉 Fixed {fixed_count} files!")
