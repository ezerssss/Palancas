import React, { useCallback, useEffect, useState } from 'react';
import ScrollToTop from 'react-scroll-to-top';
import { SignInDiv, SubtitleDiv, TitleDiv } from '../../styles/HomePage.styles';
import Gallery from './components/Gallery';
import { ReactComponent as ArrowSVG } from '../../images/arrow.svg';
import Firestore from '../../services/Firestore';
import { User } from '@firebase/auth';
import { useHistory } from 'react-router-dom';
import Filters from './components/Filters';
import Modal from 'react-modal';
import SendLetterModal from './components/SendLetterModal';
import Swal from 'sweetalert2';
import { collection, onSnapshot } from 'firebase/firestore';
import { NotificationManager } from 'react-notifications';
import SignedInView from './components/SignedInView';

interface PropsInterface {
  firestore: Firestore | undefined;
  user?: User | null;
}

const HomePage = (props: PropsInterface) => {
  const { firestore, user } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickedStudent, setPickedStudent] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [numberOfNewMessages, setNumberOfNewMessages] = useState(0);

  const history = useHistory();

  const handleButtonClick = async (sentMessages: boolean) => {
    if (!user) {
      try {
        await firestore?.signIn();
      } catch (er) {
        if (er instanceof Error) {
          if (
            er.message ===
            'FirebaseError: Firebase: Error (auth/popup-closed-by-user).'
          ) {
            return;
          }
        }
        console.error(er);
        Swal.fire(
          'Something went wrong',
          'Please contact Ezra Magbanua',
          'error'
        );
      }
    } else {
      if (sentMessages) {
        history.push('/sent-messages');
        return;
      }
      history.push('/palancas');
    }
  };

  const openModal = useCallback((student: string) => {
    setIsModalOpen(true);
    setPickedStudent(student);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await firestore?.signOut();
    } catch (er) {
      console.error(er);
    }
  };

  useEffect(() => {
    if (firestore && user) {
      const unsub = onSnapshot(
        collection(firestore.db, user.email || ''),
        (snapshot) => {
          let fetchedNewMessages = 0;
          snapshot.forEach((doc) => {
            if (!doc.data().isFetched) {
              fetchedNewMessages += 1;
            }
          });
          setNumberOfNewMessages(fetchedNewMessages);
          if (fetchedNewMessages) {
            NotificationManager.info(
              `You have (${fetchedNewMessages}) new letter(s)!`,
              'Click me!',
              5000,
              () => {
                history.push('/palancas');
              }
            );
          }
        }
      );

      return () => {
        unsub();
      };
    }
  }, [firestore, user]);

  return (
    <div>
      <SignInDiv>
        {user ? (
          <SignedInView
            handleSignOut={handleSignOut}
            handleButtonClick={handleButtonClick}
            user={user}
            numberOfNewMessages={numberOfNewMessages}
          />
        ) : (
          <p onClick={() => handleButtonClick(false)}>Sign In via Google</p>
        )}
      </SignInDiv>
      <TitleDiv>Dear kōhai,</TitleDiv>
      <SubtitleDiv marginBottom="30px">
        As our journey in Pisay comes to an end, new frontiers await us in the
        next chapter of our lives. Feel free to send us messages of support for
        us to take in our future endeavors.
      </SubtitleDiv>
      <SubtitleDiv marginBottom="30px">
        “Lilipad at lalaban, gagawa ng kasaysayan”
      </SubtitleDiv>
      <SubtitleDiv>-Gayang Mingor</SubtitleDiv>
      <Filters
        selectedSection={selectedSection}
        handleSelectedSection={(selected: string) =>
          setSelectedSection(selected)
        }
        handleSelectedStudent={(selected: string) =>
          setSelectedStudent(selected)
        }
      />
      <Gallery
        openModal={openModal}
        selectedSection={selectedSection}
        selectedStudent={selectedStudent}
      />
      <ScrollToTop
        smooth
        id="scroll-to-top"
        height="20"
        component={<ArrowSVG />}
      />
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        ariaHideApp={false}
        style={{
          content: {
            padding: '0px',
            border: '0px',
          },
        }}
      >
        <SendLetterModal
          firestore={firestore}
          user={user}
          closeModal={closeModal}
          pickedStudent={pickedStudent}
        />
      </Modal>
    </div>
  );
};

export default HomePage;
