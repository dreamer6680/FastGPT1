import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Text,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useRouter } from 'next/router';
import { getErrText } from '@fastgpt/global/common/error/utils';

interface LoginLockItem {
  username: string;
  failedAttempts: number;
  lastFailedTime: Date;
  lockExpireTime: Date | null;
  isLocked: boolean;
  remainingLockTime?: number;
}

interface LoginLockResponse {
  list: LoginLockItem[];
  total: number;
}

const LoginLockPage = () => {
  const { t } = useTranslation();
  const { userInfo } = useUserStore();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUsername, setSelectedUsername] = useState('');

  // 检查管理员权限
  React.useEffect(() => {
    if (userInfo && userInfo.role !== 'admin') {
      router.push('/dashboard');
      toast({
        title: '无权限访问',
        status: 'error'
      });
    }
  }, [userInfo, router, toast]);

  // 获取登录锁定列表
  const { data: lockData, isLoading } = useQuery({
    queryKey: ['loginLock', page, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/support/user/loginLock?action=list&page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      const result = await response.json();
      return result.data as LoginLockResponse;
    },
    enabled: userInfo?.role === 'admin'
  });

  // 解锁用户
  const unlockMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await fetch(
        `/api/admin/support/user/loginLock?action=unlock&username=${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        throw new Error('解锁失败');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loginLock'] });
      toast({
        title: '解锁成功',
        status: 'success'
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: getErrText(error),
        status: 'error'
      });
    }
  });

  // 清除所有锁定记录
  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/support/user/loginLock?action=clear', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('清除失败');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loginLock'] });
      toast({
        title: '清除成功',
        status: 'success'
      });
    },
    onError: (error) => {
      toast({
        title: getErrText(error),
        status: 'error'
      });
    }
  });

  const handleUnlock = useCallback(
    (username: string) => {
      setSelectedUsername(username);
      onOpen();
    },
    [onOpen]
  );

  const confirmUnlock = useCallback(() => {
    unlockMutation.mutate(selectedUsername);
  }, [selectedUsername, unlockMutation]);

  const handleClear = useCallback(() => {
    if (window.confirm('确定要清除所有登录锁定记录吗？')) {
      clearMutation.mutate();
    }
  }, [clearMutation]);

  if (userInfo?.role !== 'admin') {
    return null;
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          登录锁定管理
        </Text>
        <Button colorScheme="red" onClick={handleClear} isLoading={clearMutation.isLoading}>
          清除所有锁定
        </Button>
      </Flex>

      <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>用户名</Th>
              <Th>失败次数</Th>
              <Th>最后失败时间</Th>
              <Th>锁定状态</Th>
              <Th>剩余锁定时间</Th>
              <Th>操作</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lockData?.list?.map((item) => (
              <Tr key={item.username}>
                <Td>{item.username}</Td>
                <Td>{item.failedAttempts}</Td>
                <Td>{new Date(item.lastFailedTime).toLocaleString('zh-CN')}</Td>
                <Td>
                  <Badge colorScheme={item.isLocked ? 'red' : 'green'}>
                    {item.isLocked ? '已锁定' : '正常'}
                  </Badge>
                </Td>
                <Td>
                  {item.isLocked && item.remainingLockTime ? `${item.remainingLockTime} 分钟` : '-'}
                </Td>
                <Td>
                  {item.isLocked && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleUnlock(item.username)}
                      isLoading={unlockMutation.isLoading && selectedUsername === item.username}
                    >
                      解锁
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* 分页 */}
      {lockData && lockData.total > pageSize && (
        <Flex justify="center" mt={4}>
          <Button onClick={() => setPage(page - 1)} disabled={page <= 1} mr={2}>
            上一页
          </Button>
          <Text alignSelf="center" mx={4}>
            第 {page} 页，共 {Math.ceil(lockData.total / pageSize)} 页
          </Text>
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(lockData.total / pageSize)}
            ml={2}
          >
            下一页
          </Button>
        </Flex>
      )}

      {/* 解锁确认弹窗 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>确认解锁</ModalHeader>
          <ModalBody>
            确定要解锁用户 <strong>{selectedUsername}</strong> 吗？
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              取消
            </Button>
            <Button colorScheme="blue" onClick={confirmUnlock} isLoading={unlockMutation.isLoading}>
              确认解锁
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LoginLockPage;
