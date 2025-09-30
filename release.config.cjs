// release.config.cjs
module.exports = {
  branches: ["main"],
  plugins: [
    // Analisa commits para decidir o tipo de versão
    ["@semantic-release/commit-analyzer", { preset: "angular" }],

    // Gera notas de release com base nos commits
    ["@semantic-release/release-notes-generator", { preset: "angular" }],

    // Atualiza o changelog
    ["@semantic-release/changelog", { changelogFile: "CHANGELOG.md" }],

    // Atualiza package.json com a nova versão
    [
      "@semantic-release/npm",
      {
        pkgRoot: ".", // diretório onde está o package.json
        npmPublish: false, // não publica no npm
      },
    ],

    // Commita package.json, pnpm-lock.yaml e CHANGELOG.md
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
