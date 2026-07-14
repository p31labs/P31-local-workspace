import type { FractalDB, FractalNode, FractalLink, Scale } from "./types";

export interface CreateNodeInput {
  scale: Scale;
  label: string;
  didKey?: string;
  parentId?: string;
}

export async function createNode(
  db: FractalDB,
  input: CreateNodeInput,
): Promise<FractalNode> {
  const node: FractalNode = {
    id: crypto.randomUUID(),
    scale: input.scale,
    label: input.label,
    didKey: input.didKey,
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
  };
  await db.createNode(node);
  return node;
}

export async function getNode(db: FractalDB, id: string): Promise<FractalNode | null> {
  return db.getNode(id);
}

export async function listNodes(db: FractalDB, scale?: Scale): Promise<FractalNode[]> {
  return db.listNodes(scale);
}

// The fractal invariant: clone the Self pattern into a new scale.
export async function cloneNode(
  db: FractalDB,
  source: FractalNode,
  scale: Scale,
  label: string,
): Promise<FractalNode> {
  return createNode(db, { scale, label, didKey: source.didKey, parentId: source.id });
}

export async function linkNodes(
  db: FractalDB,
  fromNode: string,
  toNode: string,
  relType: FractalLink["relType"],
): Promise<FractalLink> {
  const link: FractalLink = {
    id: crypto.randomUUID(),
    fromNode,
    toNode,
    relType,
    createdAt: new Date().toISOString(),
  };
  await db.createLink(link);
  return link;
}

export async function listLinks(db: FractalDB, nodeId: string): Promise<FractalLink[]> {
  return db.listLinks(nodeId);
}
