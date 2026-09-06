# Node One Firmware - CMakeLists.txt
# ESP-IDF project structure

cmake_minimum_required(VERSION 3.16)

set(PROJECT_NAME "p31-node-one")
set(PROJECT_VERSION "1.0.0")

# Include ESP-IDF
include($ENV{IDF_PATH}/tools/cmake/project.cmake)

# Create the project
project(${PROJECT_NAME})

# Component configuration
idf_build_get_property(target IDF_TARGET)
if("${IDF_TARGET}" STREQUAL "esp32s3")
    message(STATUS "Building for ESP32-S3")
    
    # PSRAM configuration
    set(CONFIG_ESP32S3_SPIRAM_SUPPORT y)
    set(CONFIG_SPIRAM y)
    set(CONFIG_OCTAL_SPIRAM y)
endif()

# Partition table - OTA A/B scheme
set(PARTITION_TABLE "partitions_ota.csv")

# Bootloader configuration
set(CONFIG_ESP_BOOTLOADER_APP_ROLLBACK_ENABLE y)
set(CONFIG_ESP_UPDATE_AB_MODE y)