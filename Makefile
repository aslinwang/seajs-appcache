REPORTER = spec

build:
	@seatools build

site:
	@seatools build
	@seatools site -w

test:
	@mocha tests/spec/mocha-runner.js --reporter $(REPORTER)

#test-cov:lib-cov
#	$(MAKE) test REPORTER=html-cov > coverage.html

#test-cov:
#	@$(MAKE) test REPORTER='html-cov > coverage.html'

#lib-cov:
#	jscoverage lib lib-cov

totoro:
	@seatools site
	@seatools test --totoro

size:
	@seatools size
