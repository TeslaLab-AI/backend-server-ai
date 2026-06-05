export const analyzeDependencies =
  async (scanResult) => {

    try {

      let suggestions = [];

      // framework suggestions
      if (
        scanResult.framework === "Node.js"
      ) {
        suggestions.push(
          "Update Express to latest version."
        );
      }

      // package count suggestions
      if (
        scanResult.totalPackages > 10
      ) {
        suggestions.push(
          "Project has many dependencies. Remove unused packages."
        );
      }

      suggestions.push(
        "Use environment variables for secrets."
      );

      suggestions.push(
        "Add proper error handling middleware."
      );

      return suggestions;

    } catch (error) {

      console.log(error);

      throw new Error(
        "AI analysis failed"
      );

    }
};

export const calculateHealthScore =
  (scanResult) => {

    let score = 100;

    const issues = [];

    // Too many dependencies
    if (
      scanResult.totalPackages > 15
    ) {

      score -= 10;

      issues.push(
        "Too many dependencies"
      );

    }

    // No testing library
    const packages =
      scanResult.packages || {};

    if (
      !packages.jest &&
      !packages.vitest
    ) {

      score -= 10;

      issues.push(
        "No testing library found"
      );

    }

    // No TypeScript
    if (
      !packages.typescript
    ) {

      score -= 5;

      issues.push(
        "TypeScript not installed"
      );

    }

    return {
      score,
      issues
    };

};