rm -rf todos_arquivos.txt

find . -type f \
  -not -path "*/node_modules/*" \
  -not -name "*/map/*.json" \
  -not -name "*.gitignore" \
  -not -name "*.sh" \
  -not -name "*.txt" \
  -not -name "*.git" \
  -not -name "*.md" \
  -not -name "*.jpg" -not -name "*.jpeg" \
  -not -name "*.png" -not -name "*.gif" \
  -not -name "*.bmp" -not -name "*.svg" \
  -not -name "*.webp" -not -name "*.ico" \
  -not -name "*.wav" -not -name "*.mp3" \
  -exec sh -c 'echo "=== {} ==="; cat "{}"; echo -e "\n"' \; > todos_arquivos.txt