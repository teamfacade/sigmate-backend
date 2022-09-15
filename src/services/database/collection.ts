import { Op } from 'sequelize';
import { Transaction } from 'sequelize/types';
import db from '../../models';
import BcToken, { BcTokenCreationAttributes } from '../../models/BcToken';
import Block from '../../models/Block';
import Collection, {
  BlockCollectionAttrib,
  CollectionAttributes,
  CollectionCreationDTO,
  CollectionDeletionDTO,
  CollectionUpdateDTO,
} from '../../models/Collection';
import CollectionDeployer from '../../models/CollectionDeployer';
import CollectionCategory, {
  CollectionCategoryAttributes,
  CollectionCategoryCreationDTO,
  CollectionCategoryFindOrCreateDTO,
  CollectionCategoryUpdateDTO,
} from '../../models/CollectionCategory';
import CollectionUtility, {
  CollectionUtilityAttributes,
  CollectionUtilityCreationDTO,
  CollectionUtilityFindOrCreateDTO,
  CollectionUtilityUpdateDTO,
} from '../../models/CollectionUtility';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import SequelizeError from '../../utils/errors/SequelizeError';
import {
  auditTextBlock,
  createCollectionAttribBlock,
  deleteCollectionAttribBlocks,
} from './wiki/block';
import ConflictError from '../../utils/errors/ConflictError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import BadRequestError from '../../utils/errors/BadRequestError';

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

export const findOrCreateCollectionCategory = async (
  collectionCategoryDTO: CollectionCategoryFindOrCreateDTO,
  transaction: Transaction | undefined = undefined
) => {
  try {
    // Collection category
    const [cc, created] = await CollectionCategory.findOrCreate({
      where: { name: collectionCategoryDTO.name },
      transaction,
    });
    const ps: Promise<unknown>[] = []; // promises
    if (created) {
      collectionCategoryDTO.createdBy &&
        ps.push(
          cc.$set('createdBy', collectionCategoryDTO.createdBy, { transaction })
        );
      collectionCategoryDTO.createdByDevice &&
        ps.push(
          cc.$set('createdByDevice', collectionCategoryDTO.createdByDevice, {
            transaction,
          })
        );
    }
    if (collectionCategoryDTO.collection) {
      ps.push(
        collectionCategoryDTO.collection.$set('category', cc, { transaction })
      );
    }
    await Promise.all(ps);
    return cc;
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
      if (!collectionUtilityDTO.category) {
        // All utilities must belong to a collection category
        throw new ConflictError('ERR_COLLECTION_UTILITY_CREATE_NO_CATEGORY');
      }

      ps.push(
        cu.$set('category', collectionUtilityDTO.category, { transaction })
      );

      if (collectionUtilityDTO.createdBy) {
        ps.push(
          cu.$set('createdBy', collectionUtilityDTO.createdBy, { transaction })
        );
      }

      if (collectionUtilityDTO.createdByDevice) {
        ps.push(
          cu.$set('createdByDevice', collectionUtilityDTO.createdByDevice, {
            transaction,
          })
        );
      }
    }

    if (collectionUtilityDTO.collection) {
      ps.push(
        collectionUtilityDTO.collection.$set('utility', cu, { transaction })
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
      categoryBlock,
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
          approved: true,
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
          approved: true,
        },
        transaction
      ),
      // Category Block
      createCollectionAttribBlock(
        {
          element: blockElement,
          textContent: collectionDTO.category || '',
          document: collectionDTO.document,
          collection: cl,
          collectionAttrib: 'category',
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          approved: true,
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
          categoryBlock,
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

    // Find or create the collection category
    let cc: CollectionCategory | undefined = undefined;
    if (collectionDTO.category) {
      cc = await findOrCreateCollectionCategory(
        {
          name: collectionDTO.category,
          collection: cl,
          createdBy: collectionDTO.createdBy,
          createdByDevice: collectionDTO.createdByDevice,
        },
        transaction
      );
    }

    // Find or create the collection utility
    if (collectionDTO.utility) {
      ps.push(
        findOrCreateCollectionUtility(
          {
            name: collectionDTO.utility,
            collection: cl,
            category: cc || undefined,
            createdBy: collectionDTO.createdBy,
            createdByDevice: collectionDTO.createdByDevice,
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
    if (blocksObj.category && collectionDTO.category !== undefined) {
      ps.push(
        auditTextBlock(
          blocksObj.category,
          {
            textContent: collectionDTO.category,
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

    // Update the document
    if (collectionDTO.document) {
      ps.push(cl.$set('document', collectionDTO.document, { transaction }));
    }

    // Update Collection Deployers
    if (collectionDTO.collectionDeployers) {
      ps.push(
        setCollectionDeployerAddresses(
          cl,
          collectionDTO.collectionDeployers,
          transaction
        )
      );
    }

    // Update Payment Tokens
    if (collectionDTO.paymentTokens) {
      ps.push(
        setCollectionPaymentTokens(cl, collectionDTO.paymentTokens, transaction)
      );
    }

    // Find or create collection category
    let cc: CollectionCategory | undefined = undefined;
    if (collectionDTO.category !== undefined) {
      cc = await findOrCreateCollectionCategory(
        {
          name: collectionDTO.category,
          collection: cl,
          createdBy: collectionDTO.updatedBy,
          createdByDevice: collectionDTO.updatedByDevice,
        },
        transaction
      );
    } else {
      cc = cl.category || (await cl.$get('category')) || undefined;
    }

    // Find or create collection utility
    if (collectionDTO.utility !== undefined) {
      ps.push(
        findOrCreateCollectionUtility(
          {
            name: collectionDTO.utility,
            collection: cl,
            category: cc || undefined,
            createdBy: collectionDTO.updatedBy,
            createdByDevice: collectionDTO.updatedByDevice,
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

export const deleteCollectionBySlug = async (dto: CollectionDeletionDTO) => {
  try {
    await db.sequelize.transaction(async (transaction) => {
      const cl = await Collection.findOne({
        where: { slug: dto.slug },
        transaction,
      });
      if (!cl) throw new NotFoundError();
      const u = dto.deletedBy;
      if (!u) throw new UnauthenticatedError();
      const d = dto.deletedByDevice;

      // Delete associated blocks
      await deleteCollectionAttribBlocks(
        cl,
        {
          deletedBy: u,
          deletedByDevice: d,
        },
        transaction
      );
      // TODO delete associated document
      // TODO delete associated NFTs
      // TODO delete associated minting schedules

      // Mark who deleted this collection
      await cl.$set('deletedBy', u, { transaction });
      d && (await cl.$set('deletedByDevice', d, { transaction }));

      // Finally, delete collection
      await cl.destroy({ transaction });
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getCollectionCategoryById = async (
  id: CollectionCategoryAttributes['id']
) => {
  try {
    return await CollectionCategory.findByPk(id);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getCollectionCategories = async (
  query: CollectionCategoryAttributes['name'] = ''
) => {
  try {
    if (!query) {
      return await CollectionCategory.findAll({ attributes: ['id', 'name'] });
    } else {
      // Search for categories that start with query
      return await CollectionCategory.findAll({
        where: {
          name: {
            [Op.startsWith]: query,
          },
        },
        attributes: ['id', 'name'],
      });
    }
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollectionCategory = async (
  dto: CollectionCategoryCreationDTO
) => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      const cc = await CollectionCategory.create(
        {
          name: dto.name,
          createdById: dto.createdBy?.id,
          createdByDeviceId: dto.createdByDevice?.id,
        },
        { transaction }
      );
      return cc;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateCollectionCategory = async (
  dto: CollectionCategoryUpdateDTO
) => {
  try {
    if (!dto.id) throw new BadRequestError();
    const cc = await CollectionCategory.findByPk(dto.id);
    if (!cc) throw new NotFoundError();
    return await cc.update({
      name: dto.name,
      updatedById: dto.updatedBy?.id,
      updatedByDeviceId: dto.updatedByDevice?.id,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

// TODO Delete Collection Category

export const getCollectionUtilitiesByCollectionCategoryId = async (
  collectionCategoryId: CollectionCategoryAttributes['id'],
  query: CollectionUtilityAttributes['name'] | undefined = ''
) => {
  try {
    const cc = await CollectionCategory.findByPk(collectionCategoryId);
    if (!cc) throw new NotFoundError();
    if (!query) {
      // TODO pagination
      return await cc.$get('utilities', { attributes: ['id', 'name'] });
    } else {
      // Look for utilities that starts with query
      return await cc.$get('utilities', {
        where: {
          name: {
            [Op.startsWith]: query,
          },
        },
        attributes: ['id', 'name'],
      });
    }
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollectionUtility = async (
  dto: CollectionUtilityCreationDTO
) => {
  try {
    // Check if CollectionCategory exists first
    if (dto.collectionCategoryId) {
      const cu = await CollectionCategory.findByPk(dto.collectionCategoryId);
      if (!cu) throw new ConflictError();
    }

    const cu = await CollectionUtility.create({
      name: dto.name,
      createdById: dto.createdById,
      createdByDeviceId: dto.createdByDeviceId,
      collectionCategoryId: dto.collectionCategoryId,
    });

    await Promise.all([
      dto.createdBy && cu.$set('createdBy', dto.createdBy),
      dto.createdByDevice && cu.$set('createdByDevice', dto.createdByDevice),
      dto.category && cu.$set('category', dto.category),
    ]);

    return cu;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const updateCollectionUtility = async (
  dto: CollectionUtilityUpdateDTO
) => {
  try {
    const cu = await CollectionUtility.findByPk(dto.id);
    if (!cu) throw new NotFoundError();
    return await cu.update({
      name: dto.name,
      updatedById: dto.updatedBy?.id || dto.updatedById,
      updatedByDeviceId: dto.updatedByDevice?.id || dto.updatedByDeviceId,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

// TODO Delete collection utility
