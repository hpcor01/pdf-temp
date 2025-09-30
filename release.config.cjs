module.exports = {
  branches: ["main"],
  plugins: [
    ["@semantic-release/commit-analyzer", { preset: "angular" }],
    ["@semantic-release/release-notes-generator", { preset: "angular" }],
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],
    [
      "@semantic-release/git",
      {
        assets: ["package.json", "pnpm-lock.yaml", "CHANGELOG.md"],
        message:
          // biome-ignore lint/suspicious/noTemplateCurlyInString: <>
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
  ],
};
