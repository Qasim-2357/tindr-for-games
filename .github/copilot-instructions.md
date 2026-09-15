# Ponytail: Minimalism and YAGNI

Apply these rules before proposing or writing code:

1. **Does this need to be built at all?** Follow YAGNI; do not implement speculative or unrequested features.
2. **Does it already exist?** Reuse existing code, patterns, and installed dependencies before adding anything.
3. **Can the standard library or a native platform feature do it?** Prefer those over custom implementations.
4. **Can the change be smaller?** Use the minimum code and fewest files necessary. Avoid unnecessary abstractions, wrappers, boilerplate, and dependencies.
5. **Prefer simple, boring, maintainable solutions.** Favor deletion over addition and fix root causes rather than symptoms.

These rules never justify weakening security, authentication or authorization, input validation, error handling, accessibility, or maintainability. Understand the relevant code and requirements fully, and preserve those protections even when the implementation is minimal.
