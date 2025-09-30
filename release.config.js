module.exports = {
  branches: ["main"], // só executa na main
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular", // usa Conventional Commits padrão
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
      },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "package-lock.json", "CHANGELOG.md"],
        message: `chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}`,
      },
    ],
  ],
};
