#!/bin/sh
# Fails while an EMBARGO file exists in the repo root and the change is headed for develop/master.
# Used by the husky pre-push hook (reads git's pre-push stdin) and by CI (no stdin, pass --ci).
[ -f EMBARGO ] || exit 0

blocked=0
if [ "$1" = "--ci" ]; then
    blocked=1
else
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
    case "$branch" in develop | master) blocked=1 ;; esac
    if [ ! -t 0 ]; then
        while read -r _ _ remote_ref _; do
            case "$remote_ref" in refs/heads/develop | refs/heads/master) blocked=1 ;; esac
        done
    fi
fi

[ "$blocked" -eq 0 ] && exit 0
echo "EMBARGO file present: refusing to push/merge to develop or master." >&2
echo "Contents:" >&2
cat EMBARGO >&2
echo "Remove the EMBARGO file once the embargo lifts." >&2
exit 1
