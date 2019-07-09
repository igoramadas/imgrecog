ifeq ($(OS),Windows_NT)
	DOCCO:= node_modules/.bin/betterdocco.cmd
else
	DOCCO:= ./node_modules/.bin/betterdocco
endif

build:
	rm -rf *.js
	rm -rf scripts/*.js
	coffee -c index.coffee
	coffee -c -o scripts/ scripts/

docs:
	$(DOCCO) -o docs README.MD index.coffee

clean:
	rm -rf ./node_modules
	rm -rf package-lock.json

publish:
	npm publish

update:
	ncu -u
	npm install

.PHONY: build docs clean publish
