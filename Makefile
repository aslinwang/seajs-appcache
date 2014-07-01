
build:
	@seatools build

test-mocha:
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
