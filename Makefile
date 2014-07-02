
build:
	@seatools build
	@node syslib/cp.js dist/seajs-appcache-debug.js demo/dist/seajs-appcache-debug.js

static:
	@node demo/runner.js

static-w:
	@node demo/runner.js -w

mocha:
	@mocha tests/spec/mocha-runner.js

test:
	@seatools site
	@seatools test --local
	@seatools test --http

totoro:
	@seatools site
	@seatools test --totoro

size:
	@seatools size
