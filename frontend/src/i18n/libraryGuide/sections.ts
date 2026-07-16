export interface LibraryGuideStepImage {
  src: string
  altKey: string
}

export interface LibraryGuideSectionDef {
  id: string
  titleKey: string
  stepKeys: string[]
  usageGuideKeys?: string[]
  stepImages?: Record<string, LibraryGuideStepImage>
}

export const libraryGuideSectionDefs: LibraryGuideSectionDef[] = [
  {
    id: 'install',
    titleKey: 'library.install.title',
    stepKeys: ['library.install.step1', 'library.install.step2', 'library.install.step3'],
  },
  {
    id: 'seat-reservation',
    titleKey: 'library.seatReservation.title',
    usageGuideKeys: [
      'library.seatReservation.tip1',
      'library.seatReservation.tip2',
      'library.seatReservation.tip3',
      'library.seatReservation.tip4',
      'library.seatReservation.tip5',
      'library.seatReservation.tip6',
    ],
    stepKeys: [
      'library.seatReservation.step1',
      'library.seatReservation.step2',
      'library.seatReservation.step3',
      'library.seatReservation.step4',
      'library.seatReservation.step5',
    ],
    stepImages: {
      'library.seatReservation.step1': {
        src: '/library-guide-images/01_home_screen.jpg',
        altKey: 'library.seatReservation.image.homeScreen',
      },
      'library.seatReservation.step4': {
        src: '/library-guide-images/02_building_floor_select.jpg',
        altKey: 'library.seatReservation.image.buildingFloor',
      },
    },
  },
  {
    id: 'library-card',
    titleKey: 'library.libraryCard.title',
    stepKeys: [
      'library.libraryCard.step1',
      'library.libraryCard.step2',
      'library.libraryCard.step3',
    ],
  },
]
