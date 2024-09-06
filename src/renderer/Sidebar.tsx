import { useRef } from 'react'
import {
    Box,
    Badge,
    ListItemText,
    MenuList,
    IconButton,
    Stack,
    MenuItem,
    ListItemIcon,
    Typography,
    Divider,
    useTheme,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTranslation } from 'react-i18next'
import icon from './static/icon.png'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import useVersion from './hooks/useVersion'
import SessionList from './components/SessionList'
import * as sessionActions from './stores/sessionActions'
import { trackingEvent } from './packages/event'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks' // Add this import
import MenuBookIcon from '@mui/icons-material/MenuBook' // Add this import

export const drawerWidth = 240

interface Props {
    openCopilotWindow(): void
    openAboutWindow(): void
    setOpenSettingWindow(name: 'ai' | 'display' | null): void
    openPaperCollectionWindow(): void // Add this prop
    openPaperLibraryWindow(): void // Add this prop
}

export default function Sidebar(props: Props) {
    const { t } = useTranslation()
    const versionHook = useVersion()

    const sessionListRef = useRef<HTMLDivElement>(null)
    const handleCreateNewSession = () => {
        sessionActions.createEmpty('chat')
        if (sessionListRef.current) {
            sessionListRef.current.scrollTo(0, 0)
        }
        trackingEvent('create_new_conversation', { event_category: 'user' })
    }

    const theme = useTheme()

    return (
        <div
            className="fixed top-0 left-0 h-full z-50"
            style={{
                boxSizing: 'border-box',
                width: drawerWidth,
                borderRightWidth: '1px',
                borderRightStyle: 'solid',
                borderRightColor: theme.palette.divider,
            }}
        >
            <div className="ToolBar h-full">
                <Stack
                    className="pt-3 pl-2 pr-1"
                    sx={{
                        height: '100%',
                    }}
                >
                    <Box className="flex justify-between items-center p-0 m-0 mx-2 mb-4">
                        <Box>
                            <a href="https://chatboxai.app" target="_blank">
                                <img src={icon} className="w-8 h-8 mr-2 align-middle inline-block" />
                                <span className="text-2xl align-middle inline-block">ChatResearch</span>
                            </a>
                        </Box>
                        <Box></Box>
                    </Box>

                    <SessionList sessionListRef={sessionListRef} />

                    <Divider variant="fullWidth" />

                    <MenuList sx={{ marginBottom: '20px' }}>
                        <MenuItem onClick={handleCreateNewSession} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
                            <ListItemIcon>
                                <IconButton>
                                    <AddIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>{t('new chat')}</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                {/* ⌘N */}
                            </Typography>
                        </MenuItem>

                        <MenuItem onClick={props.openPaperCollectionWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
                            <ListItemIcon>
                                <IconButton>
                                    <LibraryBooksIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography>{t('Paper Collection')}</Typography>
                            </ListItemText>
                        </MenuItem>

                        <MenuItem onClick={props.openPaperLibraryWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
                            <ListItemIcon>
                                <IconButton>
                                    <MenuBookIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography>{t('My Paper Library')}</Typography>
                            </ListItemText>
                        </MenuItem>

                        <MenuItem onClick={props.openCopilotWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
                            <ListItemIcon>
                                <IconButton>
                                    <SmartToyIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>
                                <Typography>{t('My Copilots')}</Typography>
                            </ListItemText>
                        </MenuItem>


                        <MenuItem
                            onClick={() => {
                                props.setOpenSettingWindow('ai')
                            }}
                            sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}
                        >
                            <ListItemIcon>
                                <IconButton>
                                    <SettingsIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>{t('settings')}</ListItemText>
                            <Typography variant="body2" color="text.secondary">
                                {/* ⌘N */}
                            </Typography>
                        </MenuItem>

                        <MenuItem onClick={props.openAboutWindow} sx={{ padding: '0.2rem 0.1rem', margin: '0.1rem' }}>
                            <ListItemIcon>
                                <IconButton>
                                    <InfoOutlinedIcon fontSize="small" />
                                </IconButton>
                            </ListItemIcon>
                            <ListItemText>
                                <Badge
                                    color="primary"
                                    variant="dot"
                                    invisible={!versionHook.needCheckUpdate}
                                    sx={{ paddingRight: '8px' }}
                                >
                                    <Typography sx={{ opacity: 0.5 }}>
                                        {t('About')}
                                        {/\d/.test(versionHook.version) ? `(${versionHook.version})` : ''}
                                    </Typography>
                                </Badge>
                            </ListItemText>
                        </MenuItem>


                    </MenuList>
                </Stack>
            </div>
        </div>
    )
}
