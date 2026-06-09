#!/bin/bash
# Assemble and push CyberCerts website

set -e

cd /home/user/cybercerts

echo "=== Checking files ==="
ls -la js/ css/ *.html 2>/dev/null || true

# Assemble data.js from parts if they exist
if [ -f "js/data.js" ] && [ -f "js/data.js.part2" ]; then
  echo "=== Assembling data.js from parts ==="
  # Get the content of part1 (up to and not including the closing ]
  # Part1 ends with a trailing comma after last cert object
  # Part2 has raw cert objects with trailing commas
  # We need to combine them properly

  # Check if data.js already has the closing ]
  if grep -q "^];" js/data.js; then
    # Remove closing ]; from part1
    head -n -3 js/data.js > js/data.js.tmp
    mv js/data.js.tmp js/data.js
  fi

  cat js/data.js.part2 >> js/data.js

  # Add closing
  echo "" >> js/data.js
  echo "];" >> js/data.js
  echo "" >> js/data.js
  echo "// Export for module usage" >> js/data.js
  echo "if (typeof module !== 'undefined') module.exports = { CERTS };" >> js/data.js

  echo "data.js assembled"
  wc -l js/data.js
fi

echo "=== File sizes ==="
ls -la js/*.js css/*.css *.html 2>/dev/null

echo "=== Git status ==="
git status

echo "=== Committing ==="
git add -A
git commit -m "Build complete CyberCerts website with 205 cybersecurity certifications

- Full dark/cyberpunk design with glassmorphism and particle animations
- 205 certifications across 13 security domains
- Interactive 3-step cert finder on landing page
- Filterable explore page with side-by-side compare feature
- Visual pathway builder with localStorage progress tracking
- Tabbed certification detail pages with salary, skills, exam data
- AI Security domain with 7 new certs (AAISM, SecAI+, GOAA, GAIPS, GASAE, GAISP, CAISP)
- Mobile-first responsive with hamburger nav
- Dark/light mode toggle persisted in localStorage"

echo "=== Pushing ==="
git push -u origin claude/nice-cray-zo9mfd

echo "=== Done! ==="
