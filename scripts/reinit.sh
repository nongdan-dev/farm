if [[ `git status --porcelain` ]]; then
  rm -rf .git \
    && git init \
    && git add -A \
    && make -Bs f \
    && git add -A \
    && git commit -m "Initial commit" \
    && git remote add origin git@github.com:nongdan-dev/ts.git;
else
  true;
fi;
