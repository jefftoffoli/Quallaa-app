# Contributing to Quallaa

Thank you for your interest in contributing to Quallaa! We welcome contributions from the community.

## About Quallaa

Quallaa is a knowledge-first IDE built on Eclipse Theia. Our goal is to create a tool that puts knowledge management first, with code execution capabilities progressively disclosed as needed.

## License

Quallaa is licensed under the Eclipse Public License 2.0 (EPL-2.0). By contributing to this project, you agree that your contributions will be licensed under the same license.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your environment (OS, Node version, etc.)

### Suggesting Enhancements

We welcome feature suggestions! Please open an issue with:
- A clear description of the enhancement
- Why this would be useful
- Any implementation ideas you have

### Pull Requests

We welcome pull requests! Here's the process:

1. **Fork the repository** and create your branch from `master`
2. **Make your changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed
3. **Test your changes**
   ```sh
   yarn && yarn build:dev
   yarn browser start  # Test in browser
   ```
4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference any related issues
   - Sign your commits with `git commit -s`
5. **Push to your fork** and submit a pull request

### Development Setup

See the [README](README.md) for development setup instructions.

### Code Style

- Follow existing code patterns
- Use TypeScript for type safety
- Write meaningful comments for complex logic
- Keep functions focused and small

## Sign Your Work

By signing your commits, you certify that you wrote the code or have the right to submit it under the EPL-2.0 license.

Add a line to every git commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

Use your real name (no pseudonyms or anonymous contributions).

If you set your `user.name` and `user.email` git configs, you can sign commits automatically:
```sh
git commit -s
```

## Community Guidelines

- Be respectful and constructive
- Help others when you can
- Focus on the problem, not the person
- Assume good faith

## Questions?

If you have questions about contributing, feel free to open an issue.

## Recognition

Contributors will be recognized in our release notes. Thank you for helping make Quallaa better!
