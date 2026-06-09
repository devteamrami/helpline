import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterized routes must use Server render mode (cannot be prerendered without params)
  { path: 'users/:id',                          renderMode: RenderMode.Server },
  { path: 'projects/:id',                       renderMode: RenderMode.Server },
  { path: 'projects/:projectId/tasks/:taskId',  renderMode: RenderMode.Server },
  { path: 'tickets/:id',                        renderMode: RenderMode.Server },
  // All other routes can be prerendered
  { path: '**',                                 renderMode: RenderMode.Prerender },
];
