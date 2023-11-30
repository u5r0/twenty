import styled from '@emotion/styled';
import { isNonEmptyString } from '@sniptt/guards';
import { useRecoilValue } from 'recoil';
import { v4 } from 'uuid';

import { Comment } from '@/activities/comment/Comment';
import { Activity } from '@/activities/types/Activity';
import { Comment as CommentType } from '@/activities/types/Comment';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useCreateOneObjectRecord } from '@/object-record/hooks/useCreateOneObjectRecord';
import { useFindManyObjectRecords } from '@/object-record/hooks/useFindManyObjectRecords';
import {
  AutosizeTextInput,
  AutosizeTextInputVariant,
} from '@/ui/input/components/AutosizeTextInput';
import { useIsMobile } from '@/ui/utilities/responsive/hooks/useIsMobile';

const StyledThreadItemListContainer = styled.div`
  align-items: flex-start;
  border-top: 1px solid ${({ theme }) => theme.border.color.light};

  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  gap: ${({ theme }) => theme.spacing(4)};

  justify-content: flex-start;
  padding: ${({ theme }) => theme.spacing(8)};
  padding-bottom: ${({ theme }) => theme.spacing(32)};
  padding-left: ${({ theme }) => theme.spacing(12)};
  width: 100%;
`;

const StyledCommentActionBar = styled.div`
  background: ${({ theme }) => theme.background.primary};
  border-top: 1px solid ${({ theme }) => theme.border.color.light};
  bottom: 0;
  display: flex;
  padding: 16px 24px 16px 48px;
  position: absolute;
  width: calc(
    ${({ theme }) => (useIsMobile() ? '100%' : theme.rightDrawerWidth)} - 72px
  );
`;

const StyledThreadCommentTitle = styled.div`
  color: ${({ theme }) => theme.font.color.tertiary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semiBold};
  text-transform: uppercase;
`;

type ActivityCommentsProps = {
  activity: Pick<Activity, 'id'>;
  scrollableContainerRef: React.RefObject<HTMLDivElement>;
};

export const ActivityComments = ({
  activity,
  scrollableContainerRef,
}: ActivityCommentsProps) => {
  const { createOneObject } = useCreateOneObjectRecord({
    objectNameSingular: 'comment',
  });

  const currentWorkspaceMember = useRecoilValue(currentWorkspaceMemberState);

  const { objects: comments } = useFindManyObjectRecords({
    objectNamePlural: 'comments',
    filter: {
      activityId: {
        eq: activity?.id ?? '',
      },
    },
  });

  if (!currentWorkspaceMember) {
    return <></>;
  }

  const handleSendComment = (commentText: string) => {
    if (!isNonEmptyString(commentText)) {
      return;
    }

    createOneObject?.({
      id: v4(),
      authorId: currentWorkspaceMember?.id ?? '',
      activityId: activity?.id ?? '',
      body: commentText,
      createdAt: new Date().toISOString(),
    });
  };

  const handleFocus = () => {
    const scrollableContainer = scrollableContainerRef.current;

    scrollableContainer?.scrollTo({
      top: scrollableContainer.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {comments.length > 0 && (
        <>
          <StyledThreadItemListContainer>
            <StyledThreadCommentTitle>Comments</StyledThreadCommentTitle>
            {comments?.map((comment) => (
              <Comment key={comment.id} comment={comment as CommentType} />
            ))}
          </StyledThreadItemListContainer>
        </>
      )}

      <StyledCommentActionBar>
        {currentWorkspaceMember && (
          <AutosizeTextInput
            onValidate={handleSendComment}
            onFocus={handleFocus}
            variant={AutosizeTextInputVariant.Button}
            placeholder={comments.length > 0 ? 'Reply...' : undefined}
          />
        )}
      </StyledCommentActionBar>
    </>
  );
};
