apps = api studio collect visit

# Show the version of each app
version:
	@for a in $(apps); do printf '%-8s ' $$a; node -p "require('./$$a/package.json').version"; done

# Set the same version in all apps: make bump v=2.2.0 (or v=patch|minor|major, applied to api's version)
bump:
	@test -n "$(v)" || (echo "usage: make bump v=<x.y.z|patch|minor|major>" && exit 1)
	@cd api && npm version $(v) --no-git-tag-version >/dev/null
	@nv=$$(node -p "require('./api/package.json').version"); \
	for a in studio collect visit; do (cd $$a && npm pkg set version=$$nv); done; \
	echo "Version set to $$nv"

# Commit and tag the current version (then push with: git push --follow-tags)
tag:
	@nv=$$(node -p "require('./api/package.json').version"); \
	git commit -am "$$nv" && git tag -a "$$nv" -m "$$nv"

build push clean:
	@for a in $(apps); do $(MAKE) -C $$a $@ || exit 1; done

.PHONY: version bump tag build push clean
