<script setup lang="ts">
import type { ElMessage, FormInstance, FormRules } from 'element-plus'
import { getCurrentInstance, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { changePasswordApi, Index } from '@/api'
import { useAccountStore, useThemeStore } from '@/store'
import LoginBg from './weight/LoginBg/index.vue'

/** 登录表单模型 */
interface LoginFormModel {
  /** 账号 */
  username: string
  /** 密码 */
  password: string
  /** 登录来源（保留字段） */
  source: number
}

/** 强制改密表单模型 */
interface PasswordFormModel {
  /** 原密码 */
  oldPassword: string
  /** 新密码 */
  newPassword: string
  /** 确认新密码 */
  confirmPassword: string
}

/** 页面局部状态 */
interface LoginState {
  /** 登录 / 改密进行中 */
  loading: boolean
  /** 密码框展示类型 */
  psdType: 'password' | 'text'
  /** 是否展示强制改密表单 */
  showChangePwd: boolean
}

const { t } = useI18n()

// element-plus 把 $message 挂在 app.config.globalProperties 上，
// 其类型增强（element-plus/global）未在本项目 tsconfig 中引入，
// 这里用交叉类型补齐本组件实际使用到的成员。
type GlobalMessageHost = NonNullable<NonNullable<ReturnType<typeof getCurrentInstance>>['proxy']> & {
  $message: typeof ElMessage
}

const instance = getCurrentInstance()!
const ctx = instance.proxy as GlobalMessageHost
const store = useAccountStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()
const state = reactive<LoginState>({
  loading: false,
  psdType: 'password',
  showChangePwd: false,
})
const form = ref<LoginFormModel>({
  username: '',
  password: '',
  source: 1,
})
const pwdForm = ref<PasswordFormModel>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const rules: FormRules<LoginFormModel> = {
  username: [
    { required: true, message: t('login.username_placeholder'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('login.password_placeholder'), trigger: 'blur' },
  ],
}
const pwdRules: FormRules<PasswordFormModel> = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, val: string, cb: (error?: string | Error) => void) => {
        if (val && val.length < 8)
          cb(new Error('密码至少8位'))
        else if (val && !/[A-Z]/.test(val))
          cb(new Error('需包含大写字母'))
        else if (val && !/[a-z]/.test(val))
          cb(new Error('需包含小写字母'))
        else if (val && !/\d/.test(val))
          cb(new Error('需包含数字'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: unknown, val: string, cb: (error?: string | Error) => void) => {
        if (val !== pwdForm.value.newPassword)
          cb(new Error('两次密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}
const loginForm = ref<FormInstance | null>(null)
const changePwdFormRef = ref<FormInstance | null>(null)

function onSubmit() {
  if (state.loading)
    return
  loginForm.value!.validate(async (valid) => {
    if (valid) {
      state.loading = true
      Index(form.value).then((rs) => {
        const { code, data } = rs
        if (code === 200) {
          // 后端未返回 tokenInfo 时不写入 store，避免把空凭证写进本地存储
          const tokenInfo = data?.tokenInfo
          if (tokenInfo)
            store.setToken(tokenInfo)
          if (data?.forceChangePwd) {
            state.showChangePwd = true
            pwdForm.value.oldPassword = form.value.password
            ctx.$message.warning({ message: '请修改默认密码', duration: 2000 })
          }
          else {
            loginSuccess()
          }
        }
      }).finally(() => {
        state.loading = false
      })
    }
  })
}

function loginSuccess() {
  ctx.$message.success({ message: t('common.login_successful'), duration: 1000 })
  const redirectPath = route.query.redirect
  if (redirectPath && redirectPath !== 'undefined') {
    const targetPath = decodeURIComponent(String(redirectPath))
    if (targetPath.startsWith('http'))
      window.location.href = targetPath
    else if (targetPath.startsWith('/'))
      router.push(targetPath)
    else router.push('/home')
  }
  else {
    router.push('/home')
  }
}

function onChangePwd() {
  changePwdFormRef.value!.validate(async (valid) => {
    if (!valid)
      return
    state.loading = true
    try {
      const { code } = await changePasswordApi({
        oldPassword: pwdForm.value.oldPassword,
        newPassword: pwdForm.value.newPassword,
      })
      if (code === 200) {
        ctx.$message.success('密码修改成功，请重新登录')
        store.clearToken()
        state.showChangePwd = false
        form.value.password = ''
      }
    }
    finally {
      state.loading = false
    }
  })
}

function showPass(e: 'password' | 'text') {
  state.psdType = e
}
</script>

<template>
  <div class="relative flex flex-col wh-full page-main">
    <div class="flex-1 flex items-center justify-center flex-col min-h-750px z-4">
      <div class="content flex flex-row">
        <div class="form-box flex-1 relative">
          <div class="account">
            <!-- 登录表单 -->
            <template v-if="!state.showChangePwd">
              <div class="text-center text-28px mb-12px color-primary lh-40px">
                {{ t('login.title') }}
              </div>
              <el-form ref="loginForm" :model="form" :rules="rules" label-position="top">
                <el-form-item :label="t('login.username')" prop="username">
                  <el-input v-model="form.username" :placeholder="t('login.username_placeholder')" />
                </el-form-item>
                <el-form-item :label="t('login.password')" prop="password">
                  <div class="w-full relative">
                    <el-input v-model="form.password" :type="state.psdType" :placeholder="t('login.password_placeholder')" />
                    <div v-if="state.psdType === 'password'" class="close" @click="showPass('text')" />
                    <div v-else class="open" @click="showPass('password')" />
                  </div>
                </el-form-item>
                <el-button class="w-full sub-btn" type="primary" :loading="state.loading" @click="onSubmit">
                  {{ t('login.login') }}
                </el-button>
              </el-form>
            </template>

            <!-- 强制改密表单 -->
            <template v-else>
              <div class="text-center text-28px mb-12px color-primary lh-40px">
                修改密码
              </div>
              <p class="text-center text-13px mb-20px" style="color: var(--el-text-color-secondary)">
                首次登录请修改默认密码（8位+大小写+数字）
              </p>
              <el-form ref="changePwdFormRef" :model="pwdForm" :rules="pwdRules" label-position="top">
                <el-form-item label="原密码" prop="oldPassword">
                  <el-input v-model="pwdForm.oldPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newPassword">
                  <el-input v-model="pwdForm.newPassword" type="password" show-password />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
                </el-form-item>
                <el-button class="w-full sub-btn" type="primary" :loading="state.loading" @click="onChangePwd">
                  确认修改
                </el-button>
              </el-form>
            </template>
          </div>
        </div>
      </div>
    </div>
    <LoginBg :theme-color="themeStore.themeJson.elColorPrimary" />
  </div>
</template>

<style lang="scss" scoped>
.content {
  width: 424px;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--dw-box-bg);
}

.account {
  width: 340px;
  margin: 40px auto;

  .input {
    line-height: 40px;
  }

  .sub-btn {
    height: 40px;
    line-height: 40px;
    margin-top: 20px;
  }

  .close {
    width: 40px;
    height: 40px;
    position: absolute;
    right: 0px;
    top: 0px;
    background-size: auto auto;
    background-position: center center;
    z-index: 10;
  }

  .open {
    @extend .close;
    background-size: auto auto;
    background-position: center center;
  }
}

::v-deep(.el-form-item__label) {
  font-size: 20px;
  line-height: 28px !important;
  margin-bottom: 7px !important;
}

::v-deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
}

:deep(.el-form-item__label:before) {
  content: '' !important;
}
</style>
