import { Bell, Ellipsis, Heart, Layers, LocateFixed, MapPin, Plus, Search, Share2 } from 'lucide-react'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ButtonGroup, GROUP_BUTTON } from '@/components/button-group'
import { EmptyScreen } from '@/components/empty-screen'
import { ImagePlaceholder } from '@/components/image-placeholder'
import { LiveTimer } from '@/components/live-timer'
import { PageHeader } from '@/components/page-header'
import { SaveButton } from '@/components/save-sheet'
import { Placeholder } from '@/components/placeholder'
import { ShapeIcon, ShapeSticker } from '@/components/shape-art'
import { TabActions } from '@/components/tab-actions'
import { ActivityAddButton } from '@/components/activity-add-button'
import { localMinute } from '@/lib/clock'
import { notify } from '@/lib/toasts'
import { NOW, type Shape } from '@/data/la28'
import { Frame, MenuDemo, SearchActionsDemo, SelectDemo, SheetDemo, TabsDemo } from './demos'
import type { Entry } from './entry'

// Every shared component, rendered for real in its main states. When you add a shared
// component, add it here too.

const BUTTON_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const
const BUTTON_SIZES = ['xs', 'sm', 'default', 'lg'] as const
const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const
const BADGE_VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'] as const

const SHAPES: Shape[] = [
  'running', 'swimming', 'basketball', 'football', 'gymnastics', 'volleyball',
  'telescope', 'ferris-wheel', 'palm', 'train', 'market', 'landmark', 'music', 'guitar', 'shell', 'sunset', 'trees', 'boat',
  'star', 'mountain', 'art', 'streetlight', 'bone', 'rocket', 'fish', 'ship', 'church', 'bell', 'flower',
  'anchor', 'waves', 'brush', 'funicular', 'amphora', 'spires', 'bridge', 'building',
  'coffee', 'taco', 'book', 'vinyl', 'grill', 'drum',
  'party', 'concert', 'dumplings', 'swap', 'languages', 'sketch', 'tv',
]

const minutesBeforeNow = (minutes: number) => localMinute(Date.parse(NOW) - minutes * 60_000)

export const PRIMITIVES: Entry[] = [
  {
    name: 'Button',
    file: 'components/ui/button',
    use: 'Any tap that does something. One default (black) button per screen for the main action.',
    demos: [
      {
        label: 'Variants',
        full: true,
        node: (
          <div className="flex flex-wrap justify-center gap-2">
            {BUTTON_VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v}
              </Button>
            ))}
          </div>
        ),
      },
      {
        label: 'Sizes',
        full: true,
        node: (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {BUTTON_SIZES.map((s) => (
              <Button key={s} size={s} variant="outline">
                {s}
              </Button>
            ))}
          </div>
        ),
      },
      {
        label: 'Icon sizes',
        node: (
          <div className="flex items-center gap-2">
            {ICON_SIZES.map((s) => (
              <Button key={s} size={s} variant="outline" aria-label={s}>
                <Heart />
              </Button>
            ))}
          </div>
        ),
      },
      {
        label: 'With icon',
        node: (
          <div className="flex gap-2">
            <Button>
              <MapPin data-icon="inline-start" />
              Collect
            </Button>
            <Button variant="outline">
              Share
              <Share2 data-icon="inline-end" />
            </Button>
          </div>
        ),
      },
      { label: 'Disabled', node: <Button disabled>Not yet</Button> },
      { label: 'Full width', full: true, node: <Button size="lg" className="w-full">Take photo</Button> },
    ],
  },
  {
    name: 'ButtonGroup',
    file: 'components/button-group',
    use: 'Two or more icon buttons that sit together (search and add in a tab header) share one glass capsule instead of standing apart. Give each child GROUP_BUTTON.',
    demos: [
      {
        label: 'Search and add',
        node: (
          <ButtonGroup label="Page actions">
            <button type="button" aria-label="Search" className={GROUP_BUTTON}>
              <Search />
            </button>
            <button type="button" aria-label="Add" className={GROUP_BUTTON}>
              <Plus />
            </button>
          </ButtonGroup>
        ),
      },
      {
        label: 'Three actions',
        node: (
          <ButtonGroup label="Pin actions">
            <button type="button" aria-label="Like" className={GROUP_BUTTON}>
              <Heart />
            </button>
            <button type="button" aria-label="Share" className={GROUP_BUTTON}>
              <Share2 />
            </button>
            <button type="button" aria-label="More" className={GROUP_BUTTON}>
              <Ellipsis />
            </button>
          </ButtonGroup>
        ),
      },
      {
        label: 'One button keeps the same capsule',
        node: (
          <ButtonGroup label="Page actions">
            <button type="button" aria-label="Add" className={GROUP_BUTTON}>
              <Plus />
            </button>
          </ButtonGroup>
        ),
      },
      {
        label: 'Over busy content, like the map: the glass blurs what\u2019s behind',
        full: true,
        node: (
          <div className="relative flex h-28 w-full items-start justify-end overflow-hidden rounded-xl p-3">
            <ul className="absolute inset-0 grid grid-cols-8 place-items-center gap-1 p-2 text-foreground/60" aria-hidden>
              {SHAPES.slice(0, 24).map((s) => (
                <li key={s}>
                  <ShapeIcon shape={s} className="size-6" />
                </li>
              ))}
            </ul>
            <ButtonGroup label="Map actions" className="relative">
              <button type="button" aria-label="Layers" className={GROUP_BUTTON}>
                <Layers />
              </button>
              <button type="button" aria-label="Locate me" className={GROUP_BUTTON}>
                <LocateFixed />
              </button>
            </ButtonGroup>
          </div>
        ),
      },
    ],
  },
  {
    name: 'Badge',
    file: 'components/ui/badge',
    use: 'Short labels on cards and rows: a status, a count, a tag.',
    demos: [
      {
        label: 'Variants',
        full: true,
        node: (
          <div className="flex flex-wrap justify-center gap-2">
            {BADGE_VARIANTS.map((v) => (
              <Badge key={v} variant={v}>
                {v}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        label: 'With icon',
        node: (
          <Badge variant="secondary">
            <MapPin data-icon="inline-start" />
            2.1 km
          </Badge>
        ),
      },
    ],
  },
  {
    name: 'Avatar',
    file: 'components/ui/avatar',
    use: 'People: friends, fans in a room, the profile button.',
    demos: [
      {
        label: 'Sizes',
        node: (
          <div className="flex items-center gap-2">
            {(['sm', 'default', 'lg'] as const).map((s) => (
              <Avatar key={s} size={s}>
                <AvatarFallback>MK</AvatarFallback>
              </Avatar>
            ))}
          </div>
        ),
      },
      {
        label: 'With badge',
        node: (
          <Avatar size="lg">
            <AvatarFallback>JR</AvatarFallback>
            <AvatarBadge />
          </Avatar>
        ),
      },
      {
        label: 'Group',
        node: (
          <AvatarGroup>
            {['AL', 'BT', 'CS'].map((n) => (
              <Avatar key={n}>
                <AvatarFallback>{n}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+4</AvatarGroupCount>
          </AvatarGroup>
        ),
      },
    ],
  },
  {
    name: 'Input',
    file: 'components/ui/input',
    use: 'One line of text: search, names, titles. Pair with Label.',
    demos: [
      {
        label: 'With label',
        full: true,
        node: (
          <div className="w-full space-y-1.5">
            <Label htmlFor="ds-input">Event name</Label>
            <Input id="ds-input" placeholder="Watch party at the beach" />
          </div>
        ),
      },
      { label: 'Filled', full: true, node: <Input defaultValue="Griffith Observatory" /> },
      { label: 'Error', full: true, node: <Input aria-invalid defaultValue="??" /> },
      { label: 'Disabled', full: true, node: <Input disabled placeholder="Can't edit" /> },
    ],
  },
  {
    name: 'Textarea',
    file: 'components/ui/textarea',
    use: 'Longer text: notes, descriptions.',
    demos: [{ label: 'Default', full: true, node: <Textarea placeholder="Leave a note for whoever finds it" /> }],
  },
  {
    name: 'Label',
    file: 'components/ui/label',
    use: 'The name above a form field.',
    demos: [{ label: 'Default', node: <Label>Who can see this</Label> }],
  },
  {
    name: 'Select',
    file: 'components/ui/select',
    use: 'Pick one from a short list in a form.',
    demos: [{ label: 'Tap to open', full: true, node: <SelectDemo /> }],
  },
  {
    name: 'Tabs',
    file: 'components/ui/tabs',
    use: 'Switch views inside one screen. Pill tabs on top; line tabs inside cards.',
    demos: [
      { label: 'Default', full: true, node: <TabsDemo variant="default" /> },
      { label: 'Line', full: true, node: <TabsDemo variant="line" /> },
    ],
  },
  {
    name: 'Dropdown menu',
    file: 'components/ui/dropdown-menu',
    use: 'A short list of actions behind one button (add, more, sort).',
    demos: [{ label: 'Tap to open', node: <MenuDemo /> }],
  },
]

export const BLOCKS: Entry[] = [
  {
    name: 'PageHeader',
    file: 'components/page-header',
    use: 'Top of every tab page: big title, page actions, the profile button.',
    demos: [
      { label: 'Title only', full: true, node: <Frame><PageHeader title="Explore" /></Frame> },
      { label: 'With TabActions', full: true, node: <Frame><PageHeader title="People" action={<TabActions tab="people" />} /></Frame> },
    ],
  },
  {
    name: 'EmptyScreen',
    file: 'components/empty-screen',
    use: 'A pushed screen that isn\u2019t designed yet, with an optional header action (event detail has Save). Its back-and-title header is copied by hand on the other pushed screens.',
    demos: [
      {
        label: 'Back goes back for real',
        full: true,
        node: (
          <div className="h-56 w-full overflow-hidden rounded-xl border [&>div]:h-full! [&>div]:pt-0!">
            <EmptyScreen title="Urban Light" />
          </div>
        ),
      },
    ],
  },
  {
    name: 'TabActions',
    file: 'components/tab-actions',
    use: 'Each tab\u2019s own page actions, in one ButtonGroup. Search opens the search page. People scans a code or shows your own. Activities and Sports have search only.',
    demos: [
      { label: 'People', node: <TabActions tab="people" /> },
      { label: 'Search only', node: <SearchActionsDemo /> },
    ],
  },
  {
    name: 'ActivityAddButton',
    file: 'components/activity-add-button',
    use: 'The primary add button on Activities: black and round, bottom right above the tab bar. Opens add a ticket and create an event, in 48px rows.',
    demos: [{ label: 'Tap to open', node: <ActivityAddButton /> }],
  },
  {
    name: 'BottomSheet',
    file: 'components/bottom-sheet',
    use: 'The draggable sheet over the map. Drag the handle or the header; it snaps to min, half and full. Only full scrolls: pulling up at half opens it fully.',
    demos: [{ label: 'Drag it', full: true, node: <SheetDemo /> }],
  },
  {
    name: 'ImagePlaceholder',
    file: 'components/image-placeholder',
    use: 'Any photo or art not designed yet. Size it with className.',
    demos: [
      { label: 'Square', node: <ImagePlaceholder className="size-20" /> },
      { label: 'Wide', node: <ImagePlaceholder className="h-20 w-36" /> },
    ],
  },
  {
    name: 'Placeholder',
    file: 'components/placeholder',
    use: 'A whole screen or area that isn’t designed yet, named.',
    demos: [{ label: 'Default', full: true, node: <div className="h-32 w-full"><Placeholder label="Chat" /></div> }],
  },
  {
    name: 'ShapeSticker',
    file: 'components/shape-art',
    use: 'Placeholder pin and marker art: a die-cut sticker of the subject. ShapeIcon is the flat version.',
    demos: [
      {
        label: 'Sticker, every shape',
        full: true,
        node: (
          <ul className="grid w-full grid-cols-6 gap-3 text-foreground">
            {SHAPES.map((s) => (
              <li key={s} title={s} className="flex justify-center">
                <ShapeSticker shape={s} className="size-9" />
              </li>
            ))}
          </ul>
        ),
      },
      {
        label: 'ShapeIcon',
        node: (
          <div className="flex gap-2">
            {SHAPES.slice(0, 5).map((s) => (
              <ShapeIcon key={s} shape={s} className="size-5" />
            ))}
          </div>
        ),
      },
    ],
  },
  {
    name: 'SaveButton',
    file: 'components/save-sheet',
    use: 'Bookmark in an event’s detail header: interested, not going. Opens Save to a list (SaveSheet), with the Watch list first and New list at the bottom. Filled when it’s on any list. Games use the one + button instead, whose sheet ends with Just interested, which opens the same SaveSheet.',
    demos: [
      { label: 'Header, not saved', node: <SaveButton item={{ kind: 'event', id: 'e_pinswap' }} header /> },
      { label: 'Header, saved', node: <SaveButton item={{ kind: 'event', id: 'e_sunrise' }} header /> },
      { label: 'Small', node: <SaveButton item={{ kind: 'event', id: 'e_sunrise' }} /> },
    ],
  },
  {
    name: 'LiveTimer',
    file: 'components/live-timer',
    use: 'How long a live game has been going. Follows the debug clock.',
    demos: [{ label: 'Started 50 min ago', node: <LiveTimer since={minutesBeforeNow(50)} /> }],
  },
  {
    name: 'Toasts',
    file: 'components/toasts',
    use: 'Banners from the top that stand in for push notifications. Call notify() from lib/toasts.',
    demos: [
      {
        label: 'Tap to show',
        node: (
          <Button variant="outline" onClick={() => notify({ title: 'A baton is nearby', body: '300 m away, near Santa Monica Pier' })}>
            <Bell data-icon="inline-start" />
            Show a toast
          </Button>
        ),
      },
    ],
  },
]
