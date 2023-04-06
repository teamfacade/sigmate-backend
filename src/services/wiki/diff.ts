import { isEqual, mapValues } from 'lodash';
import WikiDiffError from '../../errors/wiki/diff';

// type DiffResult<T> = [T, sigmate.Wiki.DiffResult];

/**
 * Process a validated user request and produce a wiki block item
 */
export default class WikiDiff {
  static START = Symbol.for('WikiDiff.START');
  static END = Symbol.for('WikiDiff.END');

  static CREATED: 'C' = 'C';
  static UPDATED: 'U' = 'U';
  static DELETED: 'D' = 'D';
  static NO_CHANGE: '-' = '-';
  static TRANSPOSED: 'T' = 'T';

  public static toResultRaw(
    result: sigmate.Wiki.DiffResult
  ): sigmate.Wiki.DiffResultRaw {
    const { action, transposed = '-' } = result;
    switch (action) {
      case this.CREATED:
        return `${this.CREATED}-`;
      case this.DELETED:
        return `${this.DELETED}-`;
      default:
        return `${action}${transposed}`;
    }
  }

  public static toResult(
    rawResult: sigmate.Wiki.DiffResultRaw
  ): sigmate.Wiki.DiffResult {
    if (rawResult.length !== 2) {
      throw new Error(`Invalid diff raw result: ${rawResult}`);
    }
    const action = rawResult[0];
    const transposed = rawResult[1];
    switch (action) {
      case this.CREATED:
      case this.DELETED:
        return { action };
      case this.UPDATED:
      case this.NO_CHANGE:
        if (transposed !== this.TRANSPOSED && transposed !== this.NO_CHANGE) {
          throw new Error(`Invalid diff transposed: ${transposed}`);
        }
        return {
          action,
          transposed,
        };
      default:
        throw new Error(`Invalid diff action: ${action}`);
    }
  }

  public static toStructureRaw(
    item: sigmate.Wiki.StructureDiff
  ): sigmate.Wiki.StructureDiffRaw {
    return {
      Id: item.id,
      Diff: this.toResultRaw(item.diff),
    };
  }

  public static toStructure(
    rawItem: sigmate.Wiki.StructureDiffRaw
  ): sigmate.Wiki.StructureDiff {
    return {
      id: rawItem.Id,
      diff: this.toResult(rawItem.Diff),
    };
  }

  /**
   * Check for transpositions in a sequence while disregarding creations and deletions
   * @param after String array
   * @param before String array
   * @returns
   */
  public static compareIdSequence(
    after: string[],
    before: string[]
  ): sigmate.Wiki.StructureDiff[] {
    const START = WikiDiff.START;
    const END = WikiDiff.END;

    const afterSet = new Set<string | symbol>(after);
    const beforeMap = new Map<string | symbol, number>();
    before.forEach((v, idx) => {
      beforeMap.set(v, idx);
    });

    // Intermediate results
    // true: Transposed, false: No change, undefined: created
    const transposed: (boolean | undefined)[] = Array(after.length).fill(
      undefined
    );

    after.forEach((value, aIdx) => {
      const bIdx = beforeMap.get(value);
      if (bIdx === undefined) {
        // Created
        transposed[aIdx] = undefined;
        return;
      }

      // Ignore creations when checking transposition
      let aPrevIdx = aIdx - 1;
      let aPrev = aPrevIdx < 0 ? START : after[aPrevIdx];
      while (!beforeMap.has(aPrev) && aPrev !== START) {
        aPrevIdx--;
        aPrev = aPrevIdx < 0 ? START : after[aPrevIdx];
      }

      let aNextIdx = aIdx + 1;
      let aNext = aNextIdx < after.length ? after[aNextIdx] : END;
      while (!beforeMap.has(aNext) && aNext !== END) {
        aNextIdx++;
        aNext = aNextIdx < after.length ? after[aNextIdx] : END;
      }

      // Ignore deletions when checking transposition
      let bPrevIdx = bIdx - 1;
      let bPrev = bPrevIdx < 0 ? START : before[bPrevIdx];
      while (!afterSet.has(bPrev) && bPrev !== START) {
        bPrevIdx--;
        bPrev = bPrevIdx < 0 ? START : before[bPrevIdx];
      }

      let bNextIdx = bIdx + 1;
      let bNext = bNextIdx < before.length ? before[bNextIdx] : END;
      while (!afterSet.has(bNext) && bNext !== END) {
        bNextIdx++;
        bNext = bNextIdx < before.length ? before[bNextIdx] : END;
      }

      if (aPrev !== bPrev && aNext !== bNext) {
        transposed[aIdx] = true;
      } else if (aPrev === bPrev && aNext === bNext) {
        transposed[aIdx] = false;
      }

      if (transposed[aIdx] === false) {
        if (aNext !== END && aNext === bNext) {
          transposed[aNextIdx] = false;
        }
        if (aPrev !== START && aPrev === bPrev) {
          transposed[aPrevIdx] = false;
        }
      }
    });

    transposed.forEach((m, idx) => {
      if (m === undefined && beforeMap.has(after[idx])) {
        transposed[idx] = true;
      }
    });

    const result: sigmate.Wiki.StructureDiff[] = [];
    after.forEach((value, idx) => {
      let bIdx = beforeMap.get(value);
      if (bIdx === undefined) {
        // Created
        result.push({
          id: value,
          diff: {
            action: WikiDiff.CREATED,
            transposed: undefined,
          },
        });
      } else {
        // No change or moved
        result.push({
          id: value,
          diff: {
            action: WikiDiff.NO_CHANGE,
            transposed: transposed[idx]
              ? WikiDiff.TRANSPOSED
              : WikiDiff.NO_CHANGE,
          },
        });
        bIdx++;
        // Deleted
        while (bIdx < before.length && !afterSet.has(before[bIdx])) {
          result.push({
            id: before[bIdx],
            diff: {
              action: WikiDiff.DELETED,
            },
          });
          bIdx++;
        }
      }
    });

    return result;
  }

  public static compareDocumentTags(
    after: sigmate.Wiki.DocumentCRequest['tags'] | undefined,
    before: sigmate.Wiki.DocumentAttribs['tags']
  ): [sigmate.Wiki.DocumentAttribs['tags'], sigmate.Wiki.DocumentDiff['tags']] {
    if (after) {
      const afterSet = new Set<string>(after);
      const diff: sigmate.Wiki.DocumentDiff['tags'] = {};
      afterSet.forEach((tag) => {
        if (before.has(tag)) {
          diff[tag] = WikiDiff.NO_CHANGE;
        } else {
          diff[tag] = WikiDiff.CREATED;
        }
      });
      before.forEach((tag) => {
        if (!afterSet.has(tag)) {
          diff[tag] = WikiDiff.DELETED;
        }
      });
      return [afterSet, diff];
    } else {
      const diff: sigmate.Wiki.DocumentDiff['tags'] = {};
      before.forEach((tag) => {
        diff[tag] = WikiDiff.NO_CHANGE;
      });
      return [before, diff];
    }
  }

  public static checkBlockIdMatch(
    after: sigmate.Wiki.BlockURequest['id'],
    before: sigmate.Wiki.BlockAttribs['id']
  ) {
    if (after !== before) {
      throw new WikiDiffError({
        code: 'WIKI/DIFF/ER_ID_MISMATCH',
        message: `after: ${after}, before: ${before}`,
      });
    }
  }

  public static compareBlockType(
    after: sigmate.Wiki.BlockURequest['type'] | undefined,
    before: sigmate.Wiki.BlockAttribs['type']
  ): [sigmate.Wiki.BlockAttribs['type'], sigmate.Wiki.BlockDiff['type']] {
    if (after === undefined) {
      return [before, WikiDiff.NO_CHANGE];
    } else {
      return [after, before === after ? WikiDiff.NO_CHANGE : WikiDiff.UPDATED];
    }
  }

  public static compareBlockData(
    after: sigmate.Wiki.BlockURequest['data'] | undefined,
    before: sigmate.Wiki.BlockAttribs['data']
  ): [sigmate.Wiki.BlockAttribs['data'], sigmate.Wiki.BlockDiff['data']] {
    if (after === undefined) {
      return [before, WikiDiff.NO_CHANGE];
    } else {
      return [
        after,
        isEqual(before, after) ? WikiDiff.NO_CHANGE : WikiDiff.UPDATED,
      ];
    }
  }

  public static compareBlockKI(
    after: sigmate.Wiki.BlockURequest['keyInfo'],
    before: sigmate.Wiki.BlockAttribs['keyInfo']
  ): [sigmate.Wiki.BlockAttribs['keyInfo'], sigmate.Wiki.BlockDiff['keyInfo']] {
    if (after === undefined) {
      return [before, WikiDiff.NO_CHANGE];
    } else {
      if (after.name !== before?.name) {
        throw new WikiDiffError('WIKI/DIFF/RJ_KI_NAME');
      }
      const diff =
        after.label === before.label ? WikiDiff.NO_CHANGE : WikiDiff.UPDATED;
      return [after, before || after ? diff : undefined];
    }
  }

  public static compareBlockExt(
    after: sigmate.Wiki.BlockURequest['external'] | null | undefined,
    before: sigmate.Wiki.BlockAttribs['external']
  ): [
    sigmate.Wiki.BlockAttribs['external'],
    sigmate.Wiki.BlockDiff['external']
  ] {
    if (after === undefined) {
      return [
        before,
        before ? mapValues(before, () => WikiDiff.NO_CHANGE) : undefined,
      ];
    } else if (after === null) {
      return [
        undefined,
        before ? mapValues(before, () => WikiDiff.DELETED) : undefined,
      ];
    } else {
      const afterSet = new Set<string>(after);

      const diff: sigmate.Wiki.BlockDiff['external'] = {};
      afterSet.forEach((name) => {
        if (before?.has(name as sigmate.Wiki.ExtDataName)) {
          diff[name] = WikiDiff.NO_CHANGE;
        } else {
          diff[name] = WikiDiff.CREATED;
        }
      });

      before?.forEach((name) => {
        if (!afterSet.has(name)) {
          diff[name] = WikiDiff.DELETED;
        }
      });

      return [
        afterSet as Set<sigmate.Wiki.ExtDataName>,
        before || after ? diff : undefined,
      ];
    }
  }

  public static isBlockUpdated(
    typeDiff: sigmate.Wiki.BlockDiff['type'] | undefined,
    dataDiff: sigmate.Wiki.BlockDiff['data'] | undefined,
    kiDiff: sigmate.Wiki.BlockDiff['keyInfo'] | undefined,
    extDiff: sigmate.Wiki.BlockDiff['external'] | undefined
  ) {
    if (typeDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (dataDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (kiDiff !== WikiDiff.NO_CHANGE) {
      return true;
    }
    if (extDiff) {
      for (const name in extDiff) {
        if (extDiff[name] !== WikiDiff.NO_CHANGE) {
          return true;
        }
      }
    }

    return false;
  }
}
