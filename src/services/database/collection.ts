import { Transaction } from 'sequelize/types';
import db from '../../models';
import BcToken, { BcTokenCreationAttributes } from '../../models/BcToken';
import Block from '../../models/Block';
import Collection, {
  BlockCollectionAttrib,
  CollectionAttributes,
  CollectionCreationDTO,
  CollectionUpdateDTO,
} from '../../models/Collection';
import CollectionDeployer from '../../models/CollectionDeployer';
import CollectionType, {
  CollectionTypeFindOrCreateDTO,
} from '../../models/CollectionType';
import CollectionUtility, {
  CollectionUtilityFindOrCreateDTO,
} from '../../models/CollectionUtility';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import SequelizeError from '../../utils/errors/SequelizeError';
import { auditTextBlock, createCollectionAttribBlock } from './wiki/block';

export const setCollectionDeployerAddresses = async (
  collection: Collection | null,
  deployerAddresses: string[],
  transaction: Transaction | undefined = undefined
) => {
  if (!collection) throw new ApiError('ERR_DB');
  deployerAddresses = deployerAddresses.filter((da) => Boolean(da));
  if (deployerAddresses.length === 0) return;

  try {
    // Create CollectionDeployers
    const cds = await Promise.all(
      deployerAddresses.map((da) =>
        CollectionDeployer.create({ address: da }, { transaction })
      )
    );

    // Link collection to CollectionDeployers
    await Promise.all(
      cds.map((cd) => cd.$set('collection', collection, { transaction }))
    );
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setCollectionPaymentTokens = async (
  collection: Collection,
  tokens: BcTokenCreationAttributes[],
  transaction: Transaction | undefined = undefined
) => {
  if (!collection) throw new ApiError('ERR_DB');
  try {
    // Find or create tokens
    const paymentTokens = (
      await Promise.all(
        tokens.map((pt) =>
          BcToken.findOrCreate({
            where: {
              name: pt.name,
              symbol: pt.symbol,
              address: pt.address,
            },
            defaults: pt,
            transaction,
          })
        )
      )
    ).map(([pt]) => pt);

    // Link tokens to collection
    await collection.$set('paymentTokens', paymentTokens, { transaction });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findOrCreateCollectionType = async (
  collectionTypeDTO: CollectionTypeFindOrCreateDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    // Collection Type
    const [ct, created] = await CollectionType.findOrCreate({
      where: { name: collectionTypeDTO.name },
      transaction,
    });
    const ps: Promise<unknown>[] = []; // promises
    if (created) {
      collectionTypeDTO.createdBy &&
        ps.push(
          ct.$set('createdBy', collectionTypeDTO.createdBy, { transaction })
        );
      collectionTypeDTO.createdByDevice &&
        ps.push(
          ct.$set('createdByDevice', collectionTypeDTO.createdByDevice, {
            transaction,
          })
        );
    }
    if (collectionTypeDTO.collection) {
      ps.push(collectionTypeDTO.collection.$set('type', ct, { transaction }));
    }
    await Promise.all(ps);
    return ct;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findOrCreateCollectionUtility = async (
  collectionUtilityDTO: CollectionUtilityFindOrCreateDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    // Collection Utility
    const [cu, created] = await CollectionUtility.findOrCreate({
      where: { name: collectionUtilityDTO.name },
      transaction,
    });
    const ps: Promise<unknown>[] = []; // promises
    if (created) {
      collectionUtilityDTO.createdBy &&
        ps.push(
          cu.$set('createdBy', collectionUtilityDTO.createdBy, { transaction })
        );
      collectionUtilityDTO.createdByDevice &&
        ps.push(
          cu.$set('createdByDevice', collectionUtilityDTO.createdByDevice, {
            transaction,
          })
        );
    }
    if (collectionUtilityDTO.collection) {
      ps.push(
        collectionUtilityDTO.collection.$set('type', cu, { transaction })
      );
    }
    await Promise.all(ps);
    return cu;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getCollectionBySlug = async (slug: string) => {
  try {
    return await Collection.findOne({ where: { slug } });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollection = async (
  collectionDTO: CollectionCreationDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    const cl = await Collection.create(
      {
        contractAddress: collectionDTO.contractAddress,
        slug: collectionDTO.slug,
        name: collectionDTO.name,
        description: collectionDTO.description,
        contractSchema: collectionDTO.contractSchema,
        email: collectionDTO.email,
        blogUrl: collectionDTO.blogUrl,
        redditUrl: collectionDTO.redditUrl,
        facebookUrl: collectionDTO.facebookUrl,
        twitterHandle: collectionDTO.twitterHandle,
        discordUrl: collectionDTO.discordUrl,
        websiteUrl: collectionDTO.websiteUrl,
        telegramUrl: collectionDTO.telegramUrl,
        bitcointalkUrl: collectionDTO.bitcointalkUrl,
        githubUrl: collectionDTO.githubUrl,
        wechatUrl: collectionDTO.wechatUrl,
        linkedInUrl: collectionDTO.linkedInUrl,
        whitepaperUrl: collectionDTO.whitepaperUrl,
        imageUrl: collectionDTO.imageUrl,
        bannerImageUrl: collectionDTO.bannerImageUrl,
        mintingPriceWl: collectionDTO.mintingPriceWl,
        mintingPricePublic: collectionDTO.mintingPricePublic,
        floorPrice: collectionDTO.floorPrice,
        marketplace: collectionDTO.marketplace,
        openseaMetadataUpdatedAt: collectionDTO.openseaMetadataUpdatedAt,
        openseaPriceUpdatedAt: collectionDTO.openseaPriceUpdatedAt,
      },
      { transaction }
    );
    const blockElement = 'td';
    const [
      teamBlock,
      historyBlock,
      typeBlock,
      utilityBlock,
      mintingPriceWlBlock,
      mintingPricePublicBlock,
      floorPriceBlock,
      discordUrlBlock,
      twitterHandleBlock,
      websiteUrlBlock,
      chainBlock,
      marketplaceBlock,
    ] = await Promise.all([
      // Create the blocks
      // Team Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.team || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'team',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // History Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.history || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'history',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Type Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.type || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'type',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Utility Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.utility || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'utility',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Minting Price WL Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.mintingPriceWl || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'mintingPriceWl',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Minting Price Public Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.mintingPricePublic || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'mintingPricePublic',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Floor Price Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.floorPrice || '0',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'floorPrice',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Discord Url Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.discordUrl || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'discordUrl',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Twitter Handle Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.twitterHandle || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'twitterHandle',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Website URL Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.websiteUrl || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'websiteUrl',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Chain Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent:
            collectionDTO.paymentTokens.map((pt) => pt.symbol).join(', ') || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'paymentTokens',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Marketplace Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.marketplace || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'marketplace',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      ),
      // Find or create the collection type
      collectionDTO.type &&
        findOrCreateCollectionType(
          {
            name: collectionDTO.type,
            collection: cl,
            createdBy: collectionDTO.createdBy,
            createdByDevice: collectionDTO.createdByDevice,
          },
          transaction
        ),
      // Find or create the collection utility
      collectionDTO.utility &&
        findOrCreateCollectionUtility(
          {
            name: collectionDTO.utility,
            collection: cl,
            createdBy: collectionDTO.createdBy,
            createdByDevice: collectionDTO.createdByDevice,
          },
          transaction
        ),
      // Link the document
      collectionDTO.document &&
        cl.$set('document', collectionDTO.document, { transaction }),
      // Link the deployer addresses
      setCollectionDeployerAddresses(
        cl,
        collectionDTO.collectionDeployers,
        transaction
      ),
      // Link the payment tokens
      setCollectionPaymentTokens(cl, collectionDTO.paymentTokens, transaction),
    ]);

    // Link the creator
    const ps: Promise<unknown>[] = [];
    if (collectionDTO.createdBy) {
      ps.push(cl.$set('createdBy', collectionDTO.createdBy, { transaction }));
    }
    if (collectionDTO.createdByDevice) {
      ps.push(
        cl.$set('createdByDevice', collectionDTO.createdByDevice, {
          transaction,
        })
      );
    }

    // Link the blocks
    ps.push(
      cl.$set(
        'blocks',
        [
          teamBlock,
          historyBlock,
          typeBlock,
          utilityBlock,
          mintingPriceWlBlock,
          mintingPricePublicBlock,
          floorPriceBlock,
          discordUrlBlock,
          twitterHandleBlock,
          websiteUrlBlock,
          chainBlock,
          marketplaceBlock,
        ],
        { transaction }
      )
    );
    await Promise.all(ps);

    return cl;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollectionWithTx = async (
  collectionDTO: CollectionCreationDTO
) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await createCollection(collectionDTO, transaction);
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateCollectionBySlug = async (
  slug: CollectionAttributes['slug'],
  collectionDTO: CollectionUpdateDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    const cl = await Collection.findOne({ where: { slug }, transaction });
    if (!cl) throw new NotFoundError();

    await cl.update(
      {
        contractAddress: collectionDTO.contractAddress,
        slug: collectionDTO.slug,
        name: collectionDTO.name,
        description: collectionDTO.description,
        contractSchema: collectionDTO.contractSchema,
        email: collectionDTO.email,
        blogUrl: collectionDTO.blogUrl,
        redditUrl: collectionDTO.redditUrl,
        facebookUrl: collectionDTO.facebookUrl,
        twitterHandle: collectionDTO.twitterHandle,
        discordUrl: collectionDTO.discordUrl,
        websiteUrl: collectionDTO.websiteUrl,
        telegramUrl: collectionDTO.telegramUrl,
        bitcointalkUrl: collectionDTO.bitcointalkUrl,
        githubUrl: collectionDTO.githubUrl,
        wechatUrl: collectionDTO.wechatUrl,
        linkedInUrl: collectionDTO.linkedInUrl,
        whitepaperUrl: collectionDTO.whitepaperUrl,
        imageUrl: collectionDTO.imageUrl,
        bannerImageUrl: collectionDTO.bannerImageUrl,
        mintingPriceWl: collectionDTO.mintingPriceWl,
        mintingPricePublic: collectionDTO.mintingPricePublic,
        floorPrice: collectionDTO.floorPrice,
        marketplace: collectionDTO.marketplace,
        openseaMetadataUpdatedAt: collectionDTO.openseaMetadataUpdatedAt,
        openseaPriceUpdatedAt: collectionDTO.openseaPriceUpdatedAt,
      },
      { transaction }
    );

    // Audit Blocks if necessary
    const blocks = await cl.$get('blocks', { transaction });

    const blocksObj: Partial<Record<BlockCollectionAttrib, Block>> = {};

    blocks.forEach((block) => {
      if (block.collectionAttrib) {
        blocksObj[block.collectionAttrib] = block;
      }
    });

    const ps: Promise<unknown>[] = [];

    if (blocksObj.team && collectionDTO.team !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.team,
          {
            textContent: collectionDTO.team,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.history && collectionDTO.history !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.history,
          {
            textContent: collectionDTO.history,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.type && collectionDTO.type !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.type,
          {
            textContent: collectionDTO.type,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.utility && collectionDTO.utility !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.utility,
          {
            textContent: collectionDTO.utility,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (
      blocksObj.mintingPriceWl &&
      collectionDTO.mintingPriceWl !== undefined
    ) {
      ps.push(
        auditTextBlock(
          blocksObj.mintingPriceWl,
          {
            textContent: collectionDTO.mintingPriceWl,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (
      blocksObj.mintingPricePublic &&
      collectionDTO.mintingPricePublic !== undefined
    ) {
      ps.push(
        auditTextBlock(
          blocksObj.mintingPricePublic,
          {
            textContent: collectionDTO.mintingPricePublic,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.floorPrice && collectionDTO.floorPrice !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.floorPrice,
          {
            textContent: collectionDTO.floorPrice,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.discordUrl && collectionDTO.discordUrl !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.discordUrl,
          {
            textContent: collectionDTO.discordUrl,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.twitterHandle && collectionDTO.twitterHandle !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.twitterHandle,
          {
            textContent: collectionDTO.twitterHandle,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.websiteUrl && collectionDTO.websiteUrl !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.websiteUrl,
          {
            textContent: collectionDTO.websiteUrl,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.paymentTokens && collectionDTO.paymentTokens !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.paymentTokens,
          {
            textContent: collectionDTO.paymentTokens
              .map((pt) => pt.symbol)
              .join(', '),
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    if (blocksObj.marketplace && collectionDTO.marketplace !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.marketplace,
          {
            textContent: collectionDTO.marketplace,
            approved: true,
            updatedBy: collectionDTO.updatedBy,
            updatedByDevice: collectionDTO.updatedByDevice,
          },
          transaction
        )
      );
    }
    await Promise.all(ps);

    return cl;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
export const updateCollectionBySlugWithTx = async (
  slug: CollectionAttributes['slug'],
  collectionDTO: CollectionUpdateDTO
) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      return await updateCollectionBySlug(slug, collectionDTO, transaction);
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
