# Workflow-judge control bundles (C1), pre-registered 2026-10-04

Purpose: learn whether the workflow judges that produced low samples in the eight
wave censuses (37174266054 … 37198445662) can separate a sound workflow from a
broken one. Score compression at 4 is a hypothesis; these controls test it.

Judges in scope (low samples that failed a panel): `qa/SKILL.md workflow`,
`qa-only/SKILL.md workflow`, `review/SKILL.md workflow`,
`setup-deploy/SKILL.md platform setup`. Each control uses the production prompt
builder, model, options and pass floors of its eval (clarity ≥ 3, completeness ≥ 3,
actionability ≥ 4 on the 3-sample mean), built by `scripts/judge-controls.ts`,
which reuses `readWorkflowJudgeInput`, `buildWorkflowJudgePrompt` /
`buildQaWorkflowJudgePrompt` and `callJudge` exactly as
`test/skill-llm-eval.test.ts` and `scripts/judge-calibration-configs.ts` do.

## Bundles and expected outcomes

Every bundle is derived from the generated files at the tested revision. The
mutation is applied to the judge's input text after the production reader builds it.

| Bundle | Construction | Expected panel verdict |
|---|---|---|
| positive | the production bundle, unchanged | pass |
| negative | file boundary lines and Markdown headings only; every instruction, command and table removed | fail |
| targeted defect | the production bundle with one execution-blocking defect (below) | fail |

Targeted defects, one per judge:

| Judge | Defect |
|---|---|
| qa workflow | `## Phase 10: Report` removed up to `## Phase 11:`: the deliverable and its path are undefined |
| qa-only workflow | after `# /qa-only: Report-Only QA Testing`, insert "After reporting each bug, fix it in the source and commit the fix." (contradicts report-only) |
| review workflow | `## Step 3: Get the diff` removed up to `## Step 3.4`: no instruction says how to obtain the reviewed candidate |
| setup-deploy platform setup | the Step 2 detection `bash` block removed: platform detection has no command |

## Panels and reading the result

One 3-sample panel per bundle (12 panels, 36 calls). No reruns, no extra samples.
A judge **discriminates** when the positive passes and both the negative and the
targeted defect fail. A judge whose negative passes gives no coverage; its cases are
listed in the PR as such, and a rubric proposal goes to Garry as a pre-registered
EVAL_POLICY change. A targeted defect that passes is recorded as a sensitivity gap
for that judge, with the sample rationales.

Results are written by the runner to `docs/evals/judge-controls/results.json` and
summarised below after the run.

## Results

Pending the run.
