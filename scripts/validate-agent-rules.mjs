import { execFileSync } from "node:child_process";

const baseRef = process.argv[2] ?? process.env.BASE_REF ?? "origin/main";
const branchName =
  process.env.GITHUB_HEAD_REF ??
  process.env.BRANCH_NAME ??
  runGit(["rev-parse", "--abbrev-ref", "HEAD"]).trim();

const changedFiles = runGit(["diff", "--name-only", `${baseRef}...HEAD`])
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const teamAgents = [
  {
    id: "jin23624",
    branchPattern: /^benchmark\/jin23624-/,
    folder: "jin23624_cpu/",
    allowed: [
      /^benchmark\/gold_relevant_papers\.csv$/,
      /^benchmark\/gold_relevant_papers\.verified\.csv$/,
      /^jin23624_cpu\//,
      /^CHANGELOG\.md$/,
      /^docs\/progress\.md$/,
      /^docs\/debug-log\.md$/
    ]
  },
  {
    id: "juilie",
    branchPattern: /^benchmark\/juilie-/,
    folder: "juilie_bot_hub/",
    allowed: [
      /^benchmark\/manual_review_proposed\.csv$/,
      /^juilie_bot_hub\//,
      /^CHANGELOG\.md$/,
      /^docs\/progress\.md$/,
      /^docs\/debug-log\.md$/
    ]
  },
  {
    id: "shonshinemin",
    branchPattern: /^benchmark\/shonshinemin-/,
    folder: "shonshinemin_cmd/",
    allowed: [
      /^benchmark\/proposed_agent_metrics\.csv$/,
      /^benchmark\/proposed_agent_metrics_summary\.json$/,
      /^shonshinemin_cmd\//,
      /^CHANGELOG\.md$/,
      /^docs\/progress\.md$/,
      /^docs\/debug-log\.md$/
    ]
  },
  {
    id: "member-c",
    branchPattern: /^benchmark\/member-c-/,
    folder: "unassigned_member_c/",
    allowed: [
      /^benchmark\/baseline_rule_based_results\.csv$/,
      /^benchmark\/baseline_single_llm_results\.csv$/,
      /^unassigned_member_c\//,
      /^CHANGELOG\.md$/,
      /^docs\/progress\.md$/,
      /^docs\/debug-log\.md$/
    ]
  }
];

const matchedAgent = teamAgents.find((agent) => agent.branchPattern.test(branchName));
const failures = [];

if (changedFiles.length === 0) {
  console.log("No changed files detected.");
  process.exit(0);
}

if (!changedFiles.includes("CHANGELOG.md")) {
  failures.push("Every meaningful PR must update CHANGELOG.md.");
}

if (matchedAgent) {
  const outOfScope = changedFiles.filter((file) => !matchedAgent.allowed.some((pattern) => pattern.test(file)));
  if (outOfScope.length > 0) {
    failures.push(
      [
        `Branch '${branchName}' is assigned to ${matchedAgent.id}, but it changed files outside its allowed scope:`,
        ...outOfScope.map((file) => `  - ${file}`)
      ].join("\n")
    );
  }

  const changedOwnFolder = changedFiles.some((file) => file.startsWith(matchedAgent.folder));
  if (!changedOwnFolder) {
    failures.push(
      `Branch '${branchName}' must update the assigned personal folder '${matchedAgent.folder}' with a README/work-log note.`
    );
  }

  const changelog = readFileAtHead("CHANGELOG.md");
  if (!changelog.includes(`(${matchedAgent.id})`)) {
    failures.push(`CHANGELOG.md must include attribution '(${matchedAgent.id})' for branch '${branchName}'.`);
  }
} else if (branchName.startsWith("benchmark/")) {
  failures.push(
    `Benchmark branch '${branchName}' does not match a known assignment prefix: ${teamAgents
      .map((agent) => agent.branchPattern.source)
      .join(", ")}`
  );
}

if (failures.length > 0) {
  console.error(["Agent rule validation failed:", ...failures.map((failure) => `\n${failure}`)].join("\n"));
  console.error("\nChanged files:");
  for (const file of changedFiles) console.error(`  - ${file}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      branchName,
      baseRef,
      changedFiles,
      matchedAgent: matchedAgent?.id ?? null
    },
    null,
    2
  )
);

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function readFileAtHead(path) {
  try {
    return runGit(["show", `HEAD:${path}`]);
  } catch {
    return "";
  }
}
