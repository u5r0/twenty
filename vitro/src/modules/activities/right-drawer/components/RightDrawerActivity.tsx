import React from 'react';
import styled from '@emotion/styled';
import { useRecoilState } from 'recoil';

import { ActivityEditor } from '@/activities/components/ActivityEditor';
import { Activity } from '@/activities/types/Activity';
import { useFindOneObjectRecord } from '@/object-record/hooks/useFindOneObjectRecord';
import { entityFieldsFamilyState } from '@/ui/object/field/states/entityFieldsFamilyState';

import '@blocknote/core/style.css';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  overflow-y: auto;
  position: relative;
`;

type RightDrawerActivityProps = {
  activityId: string;
  showComment?: boolean;
  autoFillTitle?: boolean;
};

export const RightDrawerActivity = ({
  activityId,
  showComment = true,
  autoFillTitle = false,
}: RightDrawerActivityProps) => {
  const [, setEntityFields] = useRecoilState(
    entityFieldsFamilyState(activityId),
  );

  const { object: activity } = useFindOneObjectRecord({
    objectNameSingular: 'activity',
    objectRecordId: activityId,
    skip: !activityId,
    onCompleted: (activity: Activity) => {
      setEntityFields(activity ?? {});
    },
  });

  if (!activity) {
    return <></>;
  }

  return (
    <StyledContainer>
      <ActivityEditor
        activity={activity}
        showComment={showComment}
        autoFillTitle={autoFillTitle}
      />
    </StyledContainer>
  );
};
