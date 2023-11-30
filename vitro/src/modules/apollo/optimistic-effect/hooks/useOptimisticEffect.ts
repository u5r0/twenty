import {
  ApolloCache,
  DocumentNode,
  OperationVariables,
  useApolloClient,
} from '@apollo/client';
import { isNonEmptyArray } from '@sniptt/guards';
import { useRecoilCallback } from 'recoil';

import {
  EMPTY_QUERY,
  useObjectMetadataItem,
} from '@/object-metadata/hooks/useObjectMetadataItem';
import { ObjectMetadataItem } from '@/object-metadata/types/ObjectMetadataItem';

import { optimisticEffectState } from '../states/optimisticEffectState';
import { OptimisticEffect } from '../types/internal/OptimisticEffect';
import { OptimisticEffectDefinition } from '../types/OptimisticEffectDefinition';

export const useOptimisticEffect = ({
  objectNameSingular,
}: {
  objectNameSingular: string | undefined;
}) => {
  const apolloClient = useApolloClient();
  const { findManyQuery } = useObjectMetadataItem({
    objectNameSingular,
  });

  const registerOptimisticEffect = useRecoilCallback(
    ({ snapshot, set }) =>
      <T>({
        variables,
        definition,
      }: {
        variables: OperationVariables;
        definition: OptimisticEffectDefinition;
      }) => {
        if (findManyQuery === EMPTY_QUERY) {
          throw new Error(
            `Trying to register an optimistic effect for unknown object ${objectNameSingular}`,
          );
        }

        const optimisticEffects = snapshot
          .getLoadable(optimisticEffectState)
          .getValue();

        const optimisticEffectWriter = ({
          cache,
          newData,
          query,
          variables,
          objectMetadataItem,
        }: {
          cache: ApolloCache<unknown>;
          newData: unknown;
          variables: OperationVariables;
          query: DocumentNode;
          isUsingFlexibleBackend?: boolean;
          objectMetadataItem?: ObjectMetadataItem;
        }) => {
          if (objectMetadataItem) {
            const existingData = cache.readQuery({
              query: findManyQuery,
              variables,
            });

            if (!existingData) {
              return;
            }

            cache.writeQuery({
              query: findManyQuery,
              variables,
              data: {
                [objectMetadataItem.namePlural]: definition.resolver({
                  currentData: (existingData as any)?.[
                    objectMetadataItem.namePlural
                  ],
                  newData,
                  variables,
                }),
              },
            });

            return;
          }

          const existingData = cache.readQuery({
            query,
            variables,
          });

          if (!existingData) {
            return;
          }
        };

        const optimisticEffect = {
          key: definition.key,
          variables,
          typename: definition.typename,
          query: definition.query,
          writer: optimisticEffectWriter,
          objectMetadataItem: definition.objectMetadataItem,
          isUsingFlexibleBackend: definition.isUsingFlexibleBackend,
        } satisfies OptimisticEffect<T>;

        set(optimisticEffectState, {
          ...optimisticEffects,
          [definition.key]: optimisticEffect,
        });
      },
  );

  const triggerOptimisticEffects = useRecoilCallback(
    ({ snapshot }) =>
      (typename: string, newData: unknown) => {
        const optimisticEffects = snapshot
          .getLoadable(optimisticEffectState)
          .getValue();

        for (const optimisticEffect of Object.values(optimisticEffects)) {
          // We need to update the typename when createObject type differs from listObject types
          // It is the case for apiKey, where the creation route returns an ApiKeyToken type
          const formattedNewData = isNonEmptyArray(newData)
            ? newData.map((data: any) => {
                return { ...data, __typename: typename };
              })
            : newData;

          if (optimisticEffect.typename === typename) {
            optimisticEffect.writer({
              cache: apolloClient.cache,
              query: optimisticEffect.query ?? ({} as DocumentNode),
              newData: formattedNewData,
              variables: optimisticEffect.variables,
              isUsingFlexibleBackend: optimisticEffect.isUsingFlexibleBackend,
              objectMetadataItem: optimisticEffect.objectMetadataItem,
            });
          }
        }
      },
  );

  return {
    registerOptimisticEffect,
    triggerOptimisticEffects,
  };
};
