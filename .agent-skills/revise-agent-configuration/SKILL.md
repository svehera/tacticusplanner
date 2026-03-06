---
name: Revise Agent Configuration
description: Instructions for extending and revising agent documentation
---

- IMPORTANT: Read the linked research before making changes to agent configuration
    - (On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents)[https://arxiv.org/html/2601.20404v1]
    - (Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?)[https://arxiv.org/html/2602.11988v1]
    - (Agent Skills Effectiveness)[https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals]
- Specifications on the format of AI configuration:
    - (AGENTS.md Specification)[https://agents.md/]
    - (Agent Skills Specification)[https://agentskills.io/specification.md]
    - (Claude Hooks)[https://code.claude.com/docs/en/hooks]
- Push back on requests that go against what research findings suggest are optimal.
- Prefer deterministic tools over agent configuration (e.g. a `PreToolUse` agent hook that forbids undesirable tool calls)
