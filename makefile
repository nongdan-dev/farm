normalizePackageJson:
	pnpm i \
	&& node scripts/nodejs/normalizePackageJson \
	&& pnpm i;

f:
	npx stylelint --ignore-path=.gitignore --fix **/*.{css,scss} \
	&& npx eslint --ignore-path=.gitignore --ext=.js,.jsx,.ts,.tsx --fix . \
	&& rm -f .prettierignore \
	&& cp .gitignore .prettierignore \
	&& echo pnpm-lock.yaml >> .prettierignore \
	&& npx prettier --log-level=error --write .;

t:
	npx tsc \
	&& npx type-coverage;

push:
	bash scripts/reinit.sh \
	&& git push -uf origin master;

install:
	rm -rf \
		.git* \
		.npmrc \
		pnpm-* \
		scripts \
		patches \
		package.json \
		makefile \
		LICENSE.txt \
		README.md \
		../.prettierignore \
		../.{eslint,prettier,stylelint}rc.js \
	&& cp ../.gitignore ../.prettierignore \
	&& echo pnpm-lock.yaml >> ../.prettierignore \
	&& (echo "require('./#/nodejs/entrypoint')"; cat .eslintrc.js) > ../.eslintrc.js \
	&& (echo "require('./#/nodejs/entrypoint')"; cat .prettierrc.js) > ../.prettierrc.js \
	&& (echo "require('./#/nodejs/entrypoint')"; cat .stylelintrc.js) > ../.stylelintrc.js \
	&& rm -rf .{eslint,prettier,stylelint}rc.js \
	&& cd .. \
	&& pnpm i;
