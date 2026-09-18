import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table } from '@/components/ui/Table';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAppStore } from '@/store/appStore';
import { getApiErrorMessage } from '@/lib/api';
import { useCampaigns, useDeleteCampaign } from './useCampaigns';
import type { CampaignListItem, CampaignStatus } from './types';
import styles from './Campaigns.module.css';

const STATUS_TONE: Record<CampaignStatus, BadgeTone> = {
  ACTIVE: 'active',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired',
  DISABLED: 'disabled',
};
const STATUS_LABEL: Record<CampaignStatus, string> = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
  DISABLED: 'Disabled',
};

function formatSchedule(c: CampaignListItem): string {
  if (!c.startAt && !c.endAt) return 'Continuous';
  const fmt = (s: string | null) => (s ? s.replace('T', ' ') : '—');
  return `${fmt(c.startAtLocal)} → ${fmt(c.endAtLocal)}`;
}

export function Campaigns() {
  const storeId = useAppStore((s) => s.activeStoreId);
  const navigate = useAppStore((s) => s.navigate);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<CampaignListItem | null>(null);

  const { data, isLoading, isError, refetch } = useCampaigns(storeId, page, search);
  const del = useDeleteCampaign(storeId);

  if (!storeId) {
    return <EmptyState title="No store selected" description="Pick a store on the home screen first." />;
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success('Campaign deleted');
        setToDelete(null);
      },
      onError: (e) => toast.error(getApiErrorMessage(e)),
    });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Campaigns"
        actions={
          <>
            <Input
              className={styles.search}
              placeholder="Search by name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <Button onClick={() => navigate('campaign-form')}>
              <Plus size={16} /> New Campaign
            </Button>
          </>
        }
      />

      {isError ? (
        <div className={styles.stateBox}>
          Couldn&apos;t load campaigns.{' '}
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Schedule</th>
              <th className={styles.right}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <Skeleton width={160} />
                  </td>
                  <td>
                    <Skeleton width={70} />
                  </td>
                  <td>
                    <Skeleton width={220} />
                  </td>
                  <td />
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    title="No campaigns yet"
                    description="Create your first campaign for this store."
                    action={
                      <Button onClick={() => navigate('campaign-form')}>
                        <Plus size={16} /> New Campaign
                      </Button>
                    }
                  />
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td className={styles.name}>{c.campaignName}</td>
                  <td>
                    <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                  </td>
                  <td className={styles.schedule}>
                    {formatSchedule(c)} <span className={styles.tz}>{c.timezone}</span>
                  </td>
                  <td className={styles.right}>
                    <Button variant="ghost" size="sm" onClick={() => navigate('campaign-form', c.id)} aria-label="Edit campaign">
                      <Pencil size={15} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label="Delete campaign">
                      <Trash2 size={15} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      {meta && items.length > 0 && (
        <Pagination page={meta.page} limit={meta.limit} total={meta.total} hasMore={meta.hasMore} onPage={setPage} />
      )}

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete campaign">
        <p className={styles.confirmText}>
          Delete <strong>{toDelete?.campaignName}</strong>? It will be removed from the list.
        </p>
        <div className={styles.confirmActions}>
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" loading={del.isPending} onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
