
build:
	@seatools build

site:
	@seatools build
	@seatools site -w

mocha:
	@mocha tests/spec/mocha-runner.js

test:
	@mocha tests/spec/test.html

totoro:
	@seatools site
	@seatools test --totoro

size:
	@seatools size
