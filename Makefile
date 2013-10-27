
dependencies:
	npm install

configure:
	node install/configure.js

install: dependencies configure

start:
	node-dev server.js


test:
	mocha

.PHONY: test
