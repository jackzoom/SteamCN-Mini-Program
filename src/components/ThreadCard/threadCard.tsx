import Taro from '@tarojs/taro';
import { View, Image, Text } from '@tarojs/components';
import dayjs from 'dayjs';

import { IThreadMeta } from '../../interfaces/thread';

import './threadCard.scss';
import see from './assets/see.png';
import reply from './assets/reply.png';

interface Props {
  threadMeta: IThreadMeta;
}

class ThreadCard extends Taro.Component<Props> {
  public static defaultProps = {
    threadMeta: {
      title: '',
      tid: 1,
      url: '',
      section: '',
      timestamp: 0,
      author: {
        username: '',
        uid: 1,
        avatar: ''
      },
      stats: {
        viewed: 0,
        replied: 0
      }
    }
  };

  private toThread(): void {
    this.addToHistory();
    const { tid } = this.props.threadMeta;
    Taro.navigateTo({
      url: `/pages/thread/thread?tid=${tid}`
    });
  }

  private addToHistory(): void {
    const { threadMeta } = this.props;
    Taro.getStorage({
      key: 'history'
    }).then(
      (res): void => {
        let history = (res.data as unknown) as IThreadMeta[];

        history = history.filter((i): boolean => {
          if (i.tid === threadMeta.tid) {
            return false;
          } else {
            return true;
          }
        });

        history.push(threadMeta);
        Taro.setStorage({
          key: 'history',
          data: history
        });
      },
      (): void => {
        let history = Array<IThreadMeta>();
        history.push(threadMeta);
        Taro.setStorage({
          key: 'history',
          data: history
        });
      }
    );
  }

  public render(): JSX.Element {
    const { title, section, timestamp, author, stats } = this.props.threadMeta;
    return (
      <View className="wrapper" onClick={this.toThread}>
        <View className="header at-row at-row__justify--between">
          <View className="author at-col">
            {author.avatar && (
              <Image
                src={author.avatar}
                className="avatar"
                mode="aspectFill"
              ></Image>
            )}
            <Text>{author.username}</Text>
          </View>
          <Text className="section">{section}</Text>
        </View>
        <View className="at-row">
          <Text className="title at-col--wrap">{title}</Text>
        </View>
        <View className="footer at-row at-row__justify--between at-row__align--center">
          <View className="timestamp at-row">
            <Text>{dayjs.unix(timestamp).fromNow()}</Text>
          </View>
          <View className="stats at-row at-row__justify--end at-row__align--center">
            <Image src={see} className="icon"></Image>
            <Text>{stats.viewed}</Text>
            <Image src={reply} className="icon"></Image>
            <Text>{stats.replied}</Text>
          </View>
        </View>
      </View>
    );
  }
}

export default ThreadCard as Taro.ComponentClass<Props>;
