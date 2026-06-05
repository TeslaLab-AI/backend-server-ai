export const detectFramework = (dependencies = {}) => {

  if (dependencies.next) {
    return "Next.js";
  }

  if (dependencies.react) {
    return "React";
  }

  if (dependencies.express) {
    return "Express";
  }

  if (dependencies.fastify) {
    return "Fastify";
  }

  if (dependencies["@nestjs/core"]) {
    return "NestJS";
  }

  if (dependencies.vue) {
    return "Vue";
  }

  if (dependencies["@angular/core"]) {
    return "Angular";
  }

  return "Unknown";
};