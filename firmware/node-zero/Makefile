# Node Zero — Makefile (convenience wrappers)

.PHONY: all clean build flash flash-monitor provision batch-flash docker-build

all: build

# Ensure ESP-IDF environment is loaded (optional: auto-source if script exists)
ESPDF ?= $(HOME)/esp/esp-idf
ifeq ($(wildcard $(ESPDF)/export.sh),)
  IDF_ENV = 
else
  IDF_ENV = . $(ESPDF)/export.sh
endif

build:
	$(IDF_ENV) && cd $(CURDIR) && idf.py build

clean:
	$(IDF_ENV) && cd $(CURDIR) && idf.py fullclean

flash: build
	./flash.sh /dev/ttyUSB0 460800

flash-monitor:
	./flash.sh /dev/ttyUSB0 460800

provision:
	./provision.sh --port /dev/ttyUSB0 --ssid "$(SSID)" --pass "$(PASS)"

# Batch flash all 8 ports (requires 8 USB adapters or hub)
batch-flash:
	for dev in /dev/ttyUSB{0..7}; do \
	  idf.py -p $$dev flash & \
	done; wait

# Build inside official ESP-IDF Docker image (no host toolchain needed)
docker-build:
	docker build -t nodezero-build -f Dockerfile .
	docker run --rm -v $(CWD):/workspace nodezero-build bash -c "idf.py build"
