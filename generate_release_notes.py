#!/usr/bin/env python3
import subprocess
import sys
import argparse
import re
import os
from datetime import datetime

# Terminal styling colors
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Fallback template if local template is missing
DEFAULT_TEMPLATE = """# 📦 {project_name} — Release {version_tag}
## *{theme_catchphrase}*

```text
{ascii_logo}
```

---

## 🚀 The Core Summary

Welcome to **{version_tag}** of **{project_name}**! This release focuses on **[1-2 sentence high-level summary of the primary achievement, e.g., hardening the system's security posture, refining responsive layouts, or optimizing core data layers]**. We have streamlined **[Core Feature A]**, unlocked enhanced capabilities for **[Core Feature B]**, finalized architectural alignments for **[Core Feature C]**, and fortified our **[CI/CD / Security / Dev Environment]** boundaries to ensure optimal stability and workspace privacy.

---

## 💎 Key Themes & Highlights

### 🛠️ 1. Features & Capabilities
*Context: Newly introduced features, functional tools, or capabilities.*
{feature_bullets}

### 🔌 2. Infrastructure & API Changes
*Context: Changes to API structure, connection gateways, or networking configurations.*
{infra_bullets}

### 🎨 3. UI, UX & Design system alignment
*Context: Polish, responsive layout adaptations, or components aligned to the design guides.*
{style_bullets}

### 🛡️ 4. Security, Hygiene & Environment Hardening
*Context: Security vulnerabilities patched, changes to tracking exclusions, or dependency upgrades.*
{security_bullets}

### 👾 5. Performance, Refactoring & Miscellaneous
*Context: Optimization cycles, code cleaning, and background tooling configurations.*
{chore_bullets}

---

## 🏗️ Architectural Topology Map

```text
┌───────────────────────────────────────────────┐
│              🌐 [Layer A: Client / Frontend]  │
│  ┌──────────────────┐   ┌──────────────────┐  │
│  │ [Sub-module 1]   │   │  [Sub-module 2]  │  │
│  │   [Recent Change]│   │   [Recent Change]│  │
│  └────────┬─────────┘   └────────┬─────────┘  │
└───────────┼──────────────────────┼────────────┘
            │                      │             
            │ [Data/Protocol Flow] │             
            ▼                      ▼             
┌───────────────────────────────────────────────┐
│     🔌 [Layer B: Middleware / API / Network]   │
│        [Core Network or Routing Logic]        │
└───────────────────┬───────────────────────────┘
                    │                            
                    ▼                            
┌───────────────────────────────────────────────┐
│             🖥️ [Layer C: Backend / Storage]   │
│            [Port Configuration / Engine]      │
└───────────────────────────────────────────────┘
```

---

## 📋 Commit Ledger (Since `{start_tag}`)

{commit_ledger}

---

## ⚡ Deployment & Upgrade Instructions

### Using Local Dev Mode
Simply pull the latest release and run the developer startup script:
```bash
git pull origin {current_branch}
npm install  # Or your package manager's equivalent installation command
npm run [dev-start-script]
```

### Using Containerized Environments (Self-Hosted / Production)
If you are running the service via container orchestration, pull the updated tag and rebuild:
```bash
[container-engine, e.g., docker compose] pull
[container-engine, e.g., docker compose] up -d --build
```

---

*Stay locked, stay sovereign, stay rigid.*  
**Maintained by [Author/Agent Name] under [License Type] license.**
"""

def run_git_command(args):
    """Executes a git command and handles encoding or missing git repo environments."""
    try:
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"{Colors.FAIL}Error running git command {' '.join(args)}: {e.stderr.strip()}{Colors.ENDC}")
        return None
    except FileNotFoundError:
        print(f"{Colors.FAIL}Error: 'git' is not installed or not found in system path.{Colors.ENDC}")
        return None

def get_git_project_details():
    """Retrieves context details like repository name, latest tags, and current branch."""
    # Check if inside git directory
    is_git = run_git_command(["git", "rev-parse", "--is-inside-work-tree"])
    if not is_git or is_git != "true":
        print(f"{Colors.FAIL}Error: Current directory is not a Git repository.{Colors.ENDC}")
        sys.exit(1)

    project_name = "Project"
    git_dir = run_git_command(["git", "rev-parse", "--show-toplevel"])
    if git_dir:
        project_name = os.path.basename(git_dir).replace("-", " ").replace("_", " ").title()

    current_branch = run_git_command(["git", "branch", "--show-current"]) or "main"
    
    # Get all tags sorted by date (latest first)
    tags_raw = run_git_command(["git", "tag", "--sort=-creatordate"])
    tags = tags_raw.split("\n") if tags_raw else []
    # Strip empty entries
    tags = [t for t in tags if t]

    return project_name, current_branch, tags

def fetch_and_parse_logs(start_tag, end_tag):
    """Fetches log details and categorizes them using conventional commit markers."""
    revision_range = f"{start_tag}..{end_tag}" if start_tag else end_tag
    log_format = "%h|%s"
    
    log_raw = run_git_command(["git", "log", revision_range, f"--pretty=format:{log_format}"])
    if not log_raw:
        return []

    parsed_commits = []
    lines = log_raw.split("\n")

    for line in lines:
        if not line or "|" not in line:
            continue
        commit_hash, message = line.split("|", 1)
        
        # Match conventional commits structure: type(scope): message or type: message
        match = re.match(r"^(\w+)(?:\(([^)]+)\))?\s*:\s*(.*)$", message)
        
        if match:
            commit_type = match.group(1).lower()
            scope = match.group(2)
            clean_message = match.group(3)
        else:
            commit_type = "uncategorized"
            scope = None
            clean_message = message

        parsed_commits.append({
            "hash": commit_hash,
            "type": commit_type,
            "scope": scope,
            "message": clean_message,
            "full_subject": message
        })

    return parsed_commits

def build_highlight_bullets(commits):
    """Sorts logs and outputs Markdown formatted bullets tailored to key themes."""
    categories = {
        "features": [],
        "infra": [],
        "style": [],
        "security": [],
        "chore": []
    }

    # Map conventional commit types to target categories
    mapping = {
        "feat": "features",
        "fix": "features",
        "perf": "features",
        "ci": "infra",
        "build": "infra",
        "style": "style",
        "refactor": "chore",
        "test": "chore",
        "chore": "chore",
        "docs": "chore"
    }

    for c in commits:
        scope_prefix = f"**{c['scope']}**: " if c['scope'] else ""
        bullet_text = f"*   **{c['type'].capitalize()}:** {scope_prefix}{c['message']}"
        
        # Check security keyword triggers
        if any(keyword in c['message'].lower() or keyword in (c['scope'] or '').lower() for keyword in ["security", "env", "ignore", "secret", "auth", "lock", "protect"]):
            categories["security"].append(bullet_text)
            continue

        assigned_cat = mapping.get(c['type'], "chore")
        categories[assigned_cat].append(bullet_text)

    # Convert to clean strings
    def list_to_bullets(lst, fallback="*   *No specific changes recorded in this category.*"):
        return "\n".join(lst) if lst else fallback

    return {
        "feature_bullets": list_to_bullets(categories["features"]),
        "infra_bullets": list_to_bullets(categories["infra"]),
        "style_bullets": list_to_bullets(categories["style"]),
        "security_bullets": list_to_bullets(categories["security"]),
        "chore_bullets": list_to_bullets(categories["chore"])
    }

def generate_ascii_art(project_name):
    """Dynamically scales or returns a placeholder ASCII banner for the workspace."""
    padded_name = project_name.center(40)
    banner = f"""
       ┌────────────────────────────────────────┐
       │                                        │
       │    {padded_name}    │
       │                                        │
       └────────────────────────────────────────┘
    """
    return banner.strip("\n")

def main():
    parser = argparse.ArgumentParser(
        description="Automated Git Release Notes Draft Generator.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument("--start", help="Starting tag or commit hash (defaults to previous tag or first commit)")
    parser.add_argument("--end", default="HEAD", help="Ending tag or commit hash")
    parser.add_argument("--title", help="Explicit title to override detected repo title")
    parser.add_argument("--version", help="Explicit release version target (e.g., v1.2.0)")
    parser.add_argument("--catchphrase", default="The Stability & Security Patch", help="A catchy theme name for the release")
    parser.add_argument("--output", help="Explicit output path for generated release notes")
    args = parser.parse_args()

    print(f"{Colors.BOLD}{Colors.BLUE}🚀 Analyzing local Git Repository...{Colors.ENDC}")
    project_name, current_branch, tags = get_git_project_details()

    # Determine tag targets
    start_tag = args.start
    end_tag = args.end

    if not start_tag:
        if len(tags) > 1:
            # If at a tag now, set start tag to previous tag
            if tags[0] == end_tag or run_git_command(["git", "describe", "--tags", "--always"]) == tags[0]:
                start_tag = tags[1]
                print(f"{Colors.GREEN}✔ Detected current tag context. Comparing back to previous release tag: {start_tag}{Colors.ENDC}")
            else:
                start_tag = tags[0]
                print(f"{Colors.GREEN}✔ Automatic range tracking. Comparing back to latest release tag: {start_tag}{Colors.ENDC}")
        elif len(tags) == 1:
            start_tag = tags[0]
            print(f"{Colors.GREEN}✔ Only one release tag found. Logging changes since tag: {start_tag}{Colors.ENDC}")
        else:
            # First commit fallback
            first_commit = run_git_command(["git", "rev-list", "--max-parents=0", "HEAD"])
            start_tag = first_commit
            print(f"{Colors.WARNING}⚠ No release tags detected in repository. Pulling commits from initial codebase commit: {start_tag}{Colors.ENDC}")

    # Determine Version Code
    version_tag = args.version or (end_tag if end_tag != "HEAD" else "vNext-Draft")
    clean_project_name = args.title or project_name

    print(f"{Colors.BLUE}📦 Extracting logs from {Colors.BOLD}{start_tag}{Colors.ENDC}{Colors.BLUE} to {Colors.BOLD}{end_tag}{Colors.ENDC}...{Colors.ENDC}")
    
    # Process Logs
    commits = fetch_and_parse_logs(start_tag, end_tag)
    if not commits:
        print(f"{Colors.FAIL}❌ No commit differences found between {start_tag} and {end_tag}. Ensure you are targeting a range containing new commits.{Colors.ENDC}")
        sys.exit(1)

    print(f"{Colors.GREEN}✔ Parsed {len(commits)} commits.{Colors.ENDC}")

    # Create Markdown ledger string
    ledger_items = []
    for c in commits:
        ledger_items.append(f"*   `{c['hash']}` — **{c['type']}:** {c['full_subject'].replace(c['hash'] + '|', '').split(':', 1)[-1].strip()}")
    
    ledger_str = "\n".join(ledger_items)

    # Sort bullets for Highlights section
    bullets_map = build_highlight_bullets(commits)

    # Inject template configurations
    release_notes_md = DEFAULT_TEMPLATE.format(
        project_name=clean_project_name,
        version_tag=version_tag,
        theme_catchphrase=args.catchphrase,
        ascii_logo=generate_ascii_art(clean_project_name),
        start_tag=start_tag,
        current_branch=current_branch,
        commit_ledger=ledger_str,
        **bullets_map
    )

    # Determine Output Name
    output_filename = args.output or f"RELEASE_{version_tag.replace('/', '_')}.md"
    
    try:
        with open(output_filename, "w", encoding="utf-8") as file:
            file.write(release_notes_md)
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 Success! Your draft release notes have been prepared!{Colors.ENDC}")
        print(f"📄 Output saved to: {Colors.CYAN}{output_filename}{Colors.ENDC}")
        print(f"👉 Open this draft, tweak the Highlights details, calibrate your topological layout map, and ship it!")
    except Exception as e:
        print(f"{Colors.FAIL}❌ Failed writing to output file {output_filename}: {e}{Colors.ENDC}")
        sys.exit(1)

if __name__ == "__main__":
    main()