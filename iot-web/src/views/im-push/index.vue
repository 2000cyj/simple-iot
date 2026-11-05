<script setup lang="ts">
import type { ImPushConfigPayload } from '@/api/index'
import type { ImPushConfig } from '@/types/api'
import { ChatDotRound, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { imPushAddApi, imPushDeleteApi, imPushListApi, imPushUpdateApi } from '@/api/index'
import IotTable from '@/components/IotTable.vue'
import PageHeader from '@/components/PageHeader.vue'

/**
 * IM 推送平台（前端实际提交的值）。
 *
 * ⚠️ 前后端契约不一致（待后端修复，本文件不做任何数值转换）：
 * - 后端 Java `ImPushConfig.platform` 的类型是 `NotifyType`（`@JsonValue = int`），
 *   按 Jackson 约定 JSON 里应该是数字 1-5；
 * - 但 DDL `tb_im_push_config.platform` 是 `VARCHAR(20)`，注释为 DINGTALK / WECOM / FEISHU；
 * - 而本页面（含后端推送实现）一直按字符串提交。
 * 为了保持运行时行为不变，这里按前端实际提交的值建模。
 */
type ImPlatform = 'DINGTALK' | 'WECOM' | 'FEISHU'

/** IM 推送配置表单 */
interface ImPushForm {
  /** 配置 ID（新增时为空） */
  id?: number
  /** 配置名称 */
  name: string
  /** 推送平台 */
  platform: ImPlatform
  /** Webhook 地址 */
  webhookUrl: string
  /** 是否启用（注意：后端实体字段名是 isEnabled，见交付报告） */
  enabled: boolean
}

/** 表格列配置 */
interface TableColumn {
  prop?: string
  label?: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  slot?: string
  fixed?: 'left' | 'right' | boolean
  showOverflowTooltip?: boolean
}

const loading = ref(false)
const list = ref<ImPushConfig[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const form = ref<ImPushForm>({ name: '', platform: 'DINGTALK', webhookUrl: '', enabled: true })

const platformOptions: Array<{ label: string, value: ImPlatform }> = [
  { label: '钉钉', value: 'DINGTALK' },
  { label: '企业微信', value: 'WECOM' },
  { label: '飞书', value: 'FEISHU' },
]

const columns = computed<TableColumn[]>(() => [
  { prop: 'name', label: '名称' },
  { prop: 'platform', label: '平台', width: 120, slot: 'platform' },
  { prop: 'webhookUrl', label: 'Webhook URL', showOverflowTooltip: true },
  { prop: 'enabled', label: '状态', width: 80, slot: 'enabled' },
  { prop: 'cz', slot: 'cz', width: 160, label: '操作' },
])

/**
 * 平台 code → 展示文案。
 *
 * 取不到对应选项时回退为原始值（与改造前的 `find(...)?.label || row.platform` 语义一致）。
 */
function getPlatformLabel(platform: unknown): string {
  const matched = platformOptions.find(p => p.value === platform)
  if (matched) {
    return matched.label
  }
  return platform === undefined || platform === null ? '' : String(platform)
}

/**
 * 表单 → 后端 IM 推送配置载荷。
 *
 * ⚠️ 这里只做类型层面的转换（`as unknown as`），运行时请求体与改造前完全一致：
 * - platform 仍是字符串 'DINGTALK' / 'WECOM' / 'FEISHU'（后端期望数字，属既有契约问题）；
 * - enabled 字段名仍与后端实体的 isEnabled 不一致（属既有契约问题）。
 */
function toPayload(source: ImPushForm): ImPushConfigPayload {
  return source as unknown as ImPushConfigPayload
}

async function loadList() {
  loading.value = true
  try {
    const { data } = await imPushListApi()
    list.value = data || []
  }
  catch {
    ElMessage.error('加载失败')
  }
  finally {
    loading.value = false
  }
}

function onAdd() {
  editing.value = false
  form.value = { name: '', platform: 'DINGTALK', webhookUrl: '', enabled: true }
  dialogVisible.value = true
}

function onEdit(row: ImPushConfig) {
  editing.value = true
  // 后端返回的 platform 可能是数字（NotifyType），此处保持原样回填，运行时行为不变
  form.value = { ...row } as unknown as ImPushForm
  dialogVisible.value = true
}

async function onSave() {
  if (!form.value.name || !form.value.webhookUrl) {
    ElMessage.warning('名称和 Webhook URL 不能为空')
    return
  }
  try {
    if (editing.value) {
      await imPushUpdateApi(toPayload(form.value))
    }
    else {
      await imPushAddApi(toPayload(form.value))
    }
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadList()
  }
  catch {
    ElMessage.error('保存失败')
  }
}

async function onDelete(row: ImPushConfig) {
  await ElMessageBox.confirm(`确认删除「${row.name}」？`, '提示', { type: 'warning' })
  await imPushDeleteApi(row.id)
  ElMessage.success('已删除')
  loadList()
}

onMounted(loadList)
</script>

<template>
  <div class="page-container">
    <PageHeader title="IM 推送配置" subtitle="钉钉 / 企业微信 / 飞书 Webhook 推送" :icon="ChatDotRound" />
    <div class="glass-card">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="onAdd">
          新增配置
        </el-button>
      </div>
      <IotTable :columns="columns" :data="list" :loading="loading" :is-page="false">
        <template #platform="{ row }">
          <el-tag>{{ getPlatformLabel(row.platform) }}</el-tag>
        </template>
        <template #enabled="{ row }">
          <el-tag :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用' : '禁用' }}
          </el-tag>
        </template>
        <template #cz="{ row }">
          <el-button link type="primary" :icon="Edit" @click="onEdit(row)">
            编辑
          </el-button>
          <el-button link type="danger" :icon="Delete" @click="onDelete(row)">
            删除
          </el-button>
        </template>
      </IotTable>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑配置' : '新增配置'" width="520px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="如：运维告警群" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="form.platform" style="width: 100%">
            <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="form.webhookUrl" placeholder="https://oapi.dingtalk.com/robot/send?access_token=..." />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="onSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-xl);
  min-height: 100vh;
}

.table-toolbar {
  margin-bottom: var(--space-md);
}
</style>
