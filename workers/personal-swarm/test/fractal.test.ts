import { describe, it, expect, beforeEach } from "vitest";
import { MemoryFractalDB } from "../src/store";
import { createNode, getNode, listNodes, cloneNode, linkNodes, listLinks } from "../src/fractal";

describe("CWP-040: fractal nodes", () => {
  let store = new MemoryFractalDB();
  beforeEach(async () => {
    store = new MemoryFractalDB();
    await store.init();
  });

  it("creates and reads a Self node with a DID", async () => {
    const node = await createNode(store, { scale: "self", label: "Me", didKey: "did:key:z6Mk" });
    expect(node.id).toBeTruthy();
    expect(node.scale).toBe("self");
    const got = await getNode(store, node.id);
    expect(got?.didKey).toBe("did:key:z6Mk");
  });

  it("lists nodes filtered by scale", async () => {
    await createNode(store, { scale: "family", label: "Household" });
    await createNode(store, { scale: "career", label: "Lab" });
    const fam = await listNodes(store, "family");
    expect(fam).toHaveLength(1);
    expect(fam[0].label).toBe("Household");
  });

  it("clones the Self pattern into Family (fractal invariant)", async () => {
    const self = await createNode(store, { scale: "self", label: "Me", didKey: "did:key:z6Mk" });
    const fam = await cloneNode(store, self, "family", "Our Household");
    expect(fam.scale).toBe("family");
    expect(fam.parentId).toBe(self.id);
    expect(fam.didKey).toBe(self.didKey);
  });

  it("links nodes and lists both directions", async () => {
    const a = await createNode(store, { scale: "self", label: "A" });
    const b = await createNode(store, { scale: "family", label: "B" });
    await linkNodes(store, a.id, b.id, "guards");
    const links = await listLinks(store, a.id);
    expect(links).toHaveLength(1);
    expect(links[0].relType).toBe("guards");
    const back = await listLinks(store, b.id);
    expect(back).toHaveLength(1);
  });
});
