flux-capacitor
==============

Purpose:
========
To delegate complex coding tasks to separate claude agents that run on a separate, isolated worktree

If not in a tmux session, create a new tmux session with a proper name and tell the user how to attach. 

steps
=====
- /flux-capacitor:run command invokes skill
- skill uses scripts to
  1. create a worktree 
  2. create new tmux pane
  3. launch claude code session with --dangerously-skip-permissions
     - send <enter>meta prompt<enter> instructing flux-capacitor agent to ultrathink a plan and implement it
     - flux-capacitor agent MUST
       - delegate to appropriate subagents
       - work safe
       - create comprehensible tests, unit, components and e2e
       - perform a code review
       - perform a security review

Additional requirements:
- the scripts used by the SKILL must be placed in a subdirectory of the skills directory
- the skill must know how to find and execute them 