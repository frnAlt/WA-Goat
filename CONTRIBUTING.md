# 🤝 Contributing to WA-Goat

Thank you for your interest in contributing to **WA-Goat**! Follow these guidelines to maintain stability, performance, and code quality.

---

## 🛠️ Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/WA-Goat.git
   cd WA-Goat
   git checkout -b feature/my-new-command
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Verify Existing Tests**
   ```bash
   npm run check
   npm test
   ```

---

## 📜 Writing Commands

* Place modular GoatBot commands into `scripts/cmds/<commandName>.js` or `src/commands/<category>/<commandName>.js`.
* Ensure each command specifies:
  - `name`: Lowercase, alphanumeric command identifier.
  - `version`: Semantic version string.
  - `role`: `0` (everyone), `1` (group admin), `2` (bot admin), `4` (owner).
  - `category`: Functional category (`utility`, `media`, `fun`, `economy`, `admin`, `owner`, `ai`).
  - `guide`: Clear usage syntax for the help system.
* Use `global.utils` or WCA methods cleanly without adding unneeded third-party dependencies.

---

## 🧪 Testing Guidelines

Before opening a pull request, run the quality checks:

```bash
# 1. Syntax integrity check across all modules
npm run check

# 2. Automated test suite
npm test
```

All 35+ tests must pass with 0 errors.

---

## 📬 Submitting a Pull Request

1. Commit your changes with clear, descriptive commit messages:
   ```bash
   git commit -m "feat: add weather radar command with canvas rendering"
   ```
2. Push to your branch:
   ```bash
   git push origin feature/my-new-command
   ```
3. Open a Pull Request against the `main` branch with a summary of changes and test results.
