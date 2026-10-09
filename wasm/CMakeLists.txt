cmake_minimum_required(VERSION 3.16)
project(ocra_geometry_wasm LANGUAGES CXX)

include(FetchContent)

set(VCG_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(VCG_USE_OPENMP OFF CACHE BOOL "" FORCE)
FetchContent_Declare(
  vcglib
  GIT_REPOSITORY https://github.com/cnr-isti-vclab/vcglib.git
  GIT_TAG d590f6c75c5d3811c7abbaa94600a40155b904d6
)
FetchContent_MakeAvailable(vcglib)

add_executable(ocra-geometry src/geodesic_core.cpp)
target_compile_features(ocra-geometry PRIVATE cxx_std_17)
target_link_libraries(ocra-geometry PRIVATE vcglib)

set(GENERATED_DIR "${CMAKE_CURRENT_LIST_DIR}/../src/geometry/generated")
set_target_properties(ocra-geometry PROPERTIES
  RUNTIME_OUTPUT_DIRECTORY "${GENERATED_DIR}"
  OUTPUT_NAME "ocra-geometry"
  SUFFIX ".js"
)

target_link_options(ocra-geometry PRIVATE
  "--no-entry"
  "-sMODULARIZE=1"
  "-sEXPORT_ES6=1"
  "-sENVIRONMENT=web,worker"
  "-sALLOW_MEMORY_GROWTH=1"
  "-sFILESYSTEM=0"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_ocra_load_mesh','_ocra_clear_mesh','_ocra_compute_surface_path','_ocra_compute_surface_path_between_points','_ocra_path_data','_ocra_path_point_count','_ocra_path_length']"
)

add_custom_command(TARGET ocra-geometry POST_BUILD
  COMMAND chmod 0644
    "$<TARGET_FILE:ocra-geometry>"
    "${GENERATED_DIR}/ocra-geometry.wasm"
)
