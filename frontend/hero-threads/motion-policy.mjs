export function canAnimateThreads(motion, reduced, hidden) {
  return motion === 'running' && !reduced && !hidden;
}
