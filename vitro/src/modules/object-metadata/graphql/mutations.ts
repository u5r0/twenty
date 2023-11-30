import { gql } from '@apollo/client';

export const CREATE_ONE_METADATA_OBJECT = gql`
  mutation CreateOneObjectMetadataItem($input: CreateOneObjectInput!) {
    createOneObject(input: $input) {
      id
      dataSourceId
      nameSingular
      namePlural
      labelSingular
      labelPlural
      description
      icon
      isCustom
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ONE_METADATA_FIELD = gql`
  mutation CreateOneFieldMetadataItem($input: CreateOneFieldInput!) {
    createOneField(input: $input) {
      id
      type
      name
      label
      description
      icon
      placeholder
      isCustom
      isActive
      isNullable
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_ONE_RELATION_METADATA = gql`
  mutation CreateOneRelationMetadata($input: CreateOneRelationInput!) {
    createOneRelation(input: $input) {
      id
      relationType
      fromObjectMetadataId
      toObjectMetadataId
      fromFieldMetadataId
      toFieldMetadataId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ONE_METADATA_FIELD = gql`
  mutation UpdateOneFieldMetadataItem(
    $idToUpdate: ID!
    $updatePayload: UpdateFieldInput!
  ) {
    updateOneField(input: { id: $idToUpdate, update: $updatePayload }) {
      id
      type
      name
      label
      description
      icon
      placeholder
      isCustom
      isActive
      isNullable
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ONE_METADATA_OBJECT = gql`
  mutation UpdateOneObjectMetadataItem(
    $idToUpdate: ID!
    $updatePayload: UpdateObjectInput!
  ) {
    updateOneObject(input: { id: $idToUpdate, update: $updatePayload }) {
      id
      dataSourceId
      nameSingular
      namePlural
      labelSingular
      labelPlural
      description
      icon
      isCustom
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ONE_METADATA_OBJECT = gql`
  mutation DeleteOneObjectMetadataItem($idToDelete: ID!) {
    deleteOneObject(input: { id: $idToDelete }) {
      id
      dataSourceId
      nameSingular
      namePlural
      labelSingular
      labelPlural
      description
      icon
      isCustom
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ONE_METADATA_FIELD = gql`
  mutation DeleteOneFieldMetadataItem($idToDelete: ID!) {
    deleteOneField(input: { id: $idToDelete }) {
      id
      type
      name
      label
      description
      icon
      placeholder
      isCustom
      isActive
      isNullable
      createdAt
      updatedAt
    }
  }
`;
