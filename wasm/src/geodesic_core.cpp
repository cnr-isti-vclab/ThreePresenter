#include <vcg/complex/algorithms/closest.h>
#include <vcg/complex/algorithms/geodesic.h>
#include <vcg/complex/algorithms/update/bounding.h>
#include <vcg/complex/algorithms/update/normal.h>
#include <vcg/complex/algorithms/update/topology.h>
#include <vcg/complex/complex.h>
#include <vcg/space/index/grid_static_ptr.h>

#include <algorithm>
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <limits>
#include <vector>

namespace {

class Vertex;
class Face;
class Edge;

struct UsedTypes : public vcg::UsedTypes<
  vcg::Use<Vertex>::AsVertexType,
  vcg::Use<Face>::AsFaceType,
  vcg::Use<Edge>::AsEdgeType
> {};

class Vertex : public vcg::Vertex<
  UsedTypes,
  vcg::vertex::Coord3f,
  vcg::vertex::Normal3f,
  vcg::vertex::VFAdj,
  vcg::vertex::Qualityf,
  vcg::vertex::BitFlags,
  vcg::vertex::Mark
> {};

class Face : public vcg::Face<
  UsedTypes,
  vcg::face::VertexRef,
  vcg::face::VFAdj,
  vcg::face::FFAdj,
  vcg::face::Normal3f,
  vcg::face::BitFlags,
  vcg::face::Mark
> {};

class Edge : public vcg::Edge<UsedTypes> {};
class Mesh : public vcg::tri::TriMesh<std::vector<Vertex>, std::vector<Face>, std::vector<Edge>> {};
using FaceGrid = vcg::GridStaticPtr<Face, Mesh::ScalarType>;

Mesh mesh;
FaceGrid face_grid;
std::vector<double> path_coordinates;
double path_length = 0.0;

bool finite_point(double x, double y, double z) {
  return std::isfinite(x) && std::isfinite(y) && std::isfinite(z);
}

void clear_path() {
  path_coordinates.clear();
  path_length = 0.0;
}

void append_path_point(const vcg::Point3f& point) {
  if (!path_coordinates.empty()) {
    const std::size_t offset = path_coordinates.size() - 3;
    const double dx = point.X() - path_coordinates[offset];
    const double dy = point.Y() - path_coordinates[offset + 1];
    const double dz = point.Z() - path_coordinates[offset + 2];
    const double distance = std::sqrt(dx * dx + dy * dy + dz * dz);
    if (distance <= 1e-12) {
      return;
    }
    path_length += distance;
  }
  path_coordinates.insert(path_coordinates.end(), {point.X(), point.Y(), point.Z()});
}

int compute_surface_path(Face& source_face, const vcg::Point3f& source,
                         Face& target_face, const vcg::Point3f& target) {
  clear_path();
  if (&source_face == &target_face || (source - target).SquaredNorm() <= 1e-20f) {
    append_path_point(source);
    append_path_point(target);
    return 0;
  }

  using Geodesic = vcg::tri::Geodesic<Mesh>;
  std::vector<Geodesic::VertDist> seeds;
  for (int corner = 0; corner < 3; ++corner) {
    Vertex* vertex = source_face.V(corner);
    const float distance = (source_face.V(corner)->cP() - source).Norm();
    seeds.emplace_back(vertex, distance);
  }
  auto parent = vcg::tri::Allocator<Mesh>::GetPerVertexAttribute<Vertex*>(mesh, "path-parent");
  vcg::tri::EuclideanDistance<Mesh> distance;
  Geodesic::Visit(
    mesh,
    seeds,
    distance,
    std::numeric_limits<float>::max(),
    nullptr,
    &parent
  );

  Vertex* best_target = nullptr;
  float best_distance = std::numeric_limits<float>::max();
  for (int corner = 0; corner < 3; ++corner) {
    Vertex* vertex = target_face.V(corner);
    const float candidate = vertex->Q() + (vertex->cP() - target).Norm();
    if (candidate < best_distance) {
      best_distance = candidate;
      best_target = vertex;
    }
  }
  if (!best_target || !std::isfinite(best_distance)) {
    return -4;
  }

  std::vector<Vertex*> reverse_path;
  Vertex* current = best_target;
  for (std::size_t step = 0; step <= mesh.vert.size(); ++step) {
    reverse_path.push_back(current);
    Vertex* previous = parent[current];
    if (!previous || previous == current) {
      break;
    }
    current = previous;
  }
  append_path_point(source);
  for (auto iterator = reverse_path.rbegin(); iterator != reverse_path.rend(); ++iterator) {
    append_path_point((*iterator)->cP());
  }
  append_path_point(target);
  return 0;
}

bool closest_surface_point(double x, double y, double z, Face*& face, vcg::Point3f& closest) {
  if (mesh.face.empty() || !finite_point(x, y, z)) {
    return false;
  }
  const vcg::Point3f query(x, y, z);
  const float maximum_distance =
    std::max(1e-6f, (query - mesh.bbox.Center()).Norm() + mesh.bbox.Diag());
  float distance = maximum_distance;
  face = vcg::tri::GetClosestFaceBase(mesh, face_grid, query, maximum_distance, distance, closest);
  return face != nullptr && std::isfinite(distance);
}

}  // namespace

extern "C" {

int ocra_load_mesh(
  const double* positions,
  std::size_t vertex_count,
  const std::uint32_t* indices,
  std::size_t face_count
) {
  mesh.Clear();
  clear_path();
  if (!positions || !indices || vertex_count < 3 || face_count < 1 ||
      vertex_count > static_cast<std::size_t>(std::numeric_limits<int>::max())) {
    return -1;
  }

  vcg::tri::Allocator<Mesh>::AddVertices(mesh, vertex_count);
  for (std::size_t index = 0; index < vertex_count; ++index) {
    const double* point = positions + index * 3;
    if (!finite_point(point[0], point[1], point[2])) {
      mesh.Clear();
      return -3;
    }
    mesh.vert[index].P() = vcg::Point3f(point[0], point[1], point[2]);
  }

  vcg::tri::Allocator<Mesh>::AddFaces(mesh, face_count);
  for (std::size_t face_index = 0; face_index < face_count; ++face_index) {
    Face& face = mesh.face[face_index];
    for (int corner = 0; corner < 3; ++corner) {
      const std::uint32_t index = indices[face_index * 3 + corner];
      if (index >= vertex_count) {
        mesh.Clear();
        return -2;
      }
      face.V(corner) = &mesh.vert[index];
    }
  }

  vcg::tri::UpdateBounding<Mesh>::Box(mesh);
  vcg::tri::UpdateNormal<Mesh>::PerVertexNormalizedPerFaceNormalized(mesh);
  vcg::tri::UpdateTopology<Mesh>::FaceFace(mesh);
  vcg::tri::UpdateTopology<Mesh>::VertexFace(mesh);
  face_grid.Set(mesh.face.begin(), mesh.face.end());
  return 0;
}

void ocra_clear_mesh() {
  mesh.Clear();
  clear_path();
}

int ocra_compute_surface_path(
  std::uint32_t source_face,
  double source_x,
  double source_y,
  double source_z,
  std::uint32_t target_face,
  double target_x,
  double target_y,
  double target_z
) {
  if (mesh.face.empty()) {
    return -1;
  }
  if (source_face >= mesh.face.size() || target_face >= mesh.face.size()) {
    return -2;
  }
  if (!finite_point(source_x, source_y, source_z) ||
      !finite_point(target_x, target_y, target_z)) {
    return -3;
  }
  return compute_surface_path(
    mesh.face[source_face], vcg::Point3f(source_x, source_y, source_z),
    mesh.face[target_face], vcg::Point3f(target_x, target_y, target_z)
  );
}

int ocra_compute_surface_path_between_points(
  double source_x,
  double source_y,
  double source_z,
  double target_x,
  double target_y,
  double target_z
) {
  if (mesh.face.empty()) {
    return -1;
  }
  Face* source_face = nullptr;
  Face* target_face = nullptr;
  vcg::Point3f source;
  vcg::Point3f target;
  if (!closest_surface_point(source_x, source_y, source_z, source_face, source)) {
    return -5;
  }
  if (!closest_surface_point(target_x, target_y, target_z, target_face, target)) {
    return -6;
  }
  return compute_surface_path(*source_face, source, *target_face, target);
}

const double* ocra_path_data() {
  return path_coordinates.empty() ? nullptr : path_coordinates.data();
}

std::size_t ocra_path_point_count() {
  return path_coordinates.size() / 3;
}

double ocra_path_length() {
  return path_length;
}

}  // extern "C"
